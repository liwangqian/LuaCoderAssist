'use strict';

const langserver_1 = require('vscode-languageserver');
const cp_1         = require('child_process');
const walk_1       = require('walk');
const fs_1         = require('fs');
const uri_1        = require('vscode-uri').default;
const traits_1     = require('../../lib/symbol/symbol-traits');
const utils_1      = require('../../lib/symbol/utils');
const symbol_manager = require('./symbol-manager');
const file_manager   = require('./file-manager');

function searchFile(startpath, options, onFile, onEnd) {
    var emitter = walk_1.walk(startpath, options);

    emitter.on('file', function (dir, stat, next) {
        onFile(dir, stat.name);
        next();
    });

    emitter.on('end', () => {
        onEnd(startpath);
    });
}

exports.searchFile = searchFile;

//加载lua语法的配置文件，输出json格式
function loadConfig(fileName, cwd) {
    const program = `local _, config = require("luacov.util").load_config("${fileName}"); \
                     print(require("dkjson").encode(config));`
    const buffer = cp_1.execFileSync("lua", ["-e", program], {cwd: cwd});
    return JSON.parse(buffer.toString());
}

exports.loadConfig = loadConfig;

function fileSize(filePath) {
    return fs_1.statSync(filePath).size;
}

exports.fileSize = fileSize;


function findSymbol(position, symbols) {
    var line       = position.line;
    var character  = position.character;
    var symbol     = null;

    for (var i = 0; i < symbols.length; i++) {
        var ref = symbols[i];
        if (ref.location.start.line <= line && line <= ref.location.end.line) {
            if (ref.location.start.character <= character && character <= ref.location.end.character) {
                symbol = ref;
                break;
            }
        }
    }

    return symbol;
}

exports.findSymbol = findSymbol;

function lineContent(document, position) {
    var offsetEnd   = document.offsetAt(position);
    var offsetStart = document.offsetAt({line: position.line, character: 0});
    return document.getText().substring(offsetStart, offsetEnd);
}

exports.lineContent = lineContent;

function mapSymbolKind(kind) {
    switch (kind)
    {
        case traits_1.SymbolKind.function: return langserver_1.SymbolKind.Function;
        case traits_1.SymbolKind.class:    return langserver_1.SymbolKind.Class;
        case traits_1.SymbolKind.module:   return langserver_1.SymbolKind.Module;
        case traits_1.SymbolKind.property: return langserver_1.SymbolKind.Property;
        default: return langserver_1.SymbolKind.Variable;
    }
}

exports.mapSymbolKind = mapSymbolKind;

function mapToCompletionKind(kind) {
    switch (kind) {
        case traits_1.SymbolKind.variable:
            return langserver_1.CompletionItemKind.Variable;
        case traits_1.SymbolKind.parameter:
            return langserver_1.CompletionItemKind.Property;
        case traits_1.SymbolKind.reference:
            return langserver_1.CompletionItemKind.Reference;
        case traits_1.SymbolKind.function:
            return langserver_1.CompletionItemKind.Function;
        case traits_1.SymbolKind.class:
            return langserver_1.CompletionItemKind.Class;
        case traits_1.SymbolKind.module:
            return langserver_1.CompletionItemKind.Module;
        case traits_1.SymbolKind.dependence:
            return langserver_1.CompletionItemKind.Module;
        case traits_1.SymbolKind.property:
            return langserver_1.CompletionItemKind.Property;
        case traits_1.SymbolKind.label:
            return langserver_1.CompletionItemKind.Enum;
        default:
            return langserver_1.CompletionItemKind.Variable;
    }
}

exports.mapToCompletionKind = mapToCompletionKind;

function symbolKindDesc(kind) {
    return traits_1.SymbolKind[kind];
}

exports.symbolKindDesc = symbolKindDesc;

const backwardRegex = /[a-zA-Z0-9_.:]/; // parse all the bases
const forwardRegex  = /[a-zA-Z0-9_]/;   // parse only the name
function extendTextRange(content, from, options) {
    let range = {start: from, end: from};

    let offset = from;
    if (options.backward) {
        while (offset-- >= 0) {
            if (!backwardRegex.test(content.charAt(offset))) {
                range.start = offset;
                break;
            }
        }
    }
    
    if (options.forward) {
        offset = from;
        while (offset++ <= content.length) {
            if (!forwardRegex.test(content.charAt(offset))) {
                range.end = offset;
                break;
            }
        }
    }

    return range;
}

// parse the content to get symbol info
const symbolRegex = /(\w+)[.:]?/g;
function parseContext(content) {
    var result = { name: undefined, bases: [] };
    var match;
    while ((match = symbolRegex.exec(content)) !== null) {
        if (match.index === symbolRegex.lastIndex) {
            symbolRegex.lastIndex++;
        }
        
        var m = match[0];
        if (m.endsWith('.') || m.endsWith(':')) {
            result.bases.push(match[1]);
        } else {
            result.name = match[1];
        }
    }

    return result;
}

exports.parseContext = parseContext;

function symbolAtPosition(position, doc, options) {
    let cursor = doc.offsetAt(position);
    let text   = doc.getText();
    let range  = extendTextRange(text, cursor, options);
    if (range.start < 0) {
        return undefined;
    }

    let ref = parseContext(text.substring(range.start, range.end));
    ref.location = {start: position, end: position};    // used for scope filter
    
    return ref;
}

exports.symbolAtPosition = symbolAtPosition;

function functionSignature(symbol) {
    if (symbol.kind != traits_1.SymbolKind.function) {
        return undefined;
    }
    let baseName  = symbol.bases[symbol.bases.length-1];
    let signature = (baseName ? (baseName + '.') : '') + symbol.name + '(' + symbol.params.join(', ') + ')';
    return signature;
}

exports.functionSignature = functionSignature;

function getDefinitionsInDependences(uri, tracer) {
    let sm = symbol_manager.instance();
    let docsym = sm.documentSymbol(uri);
    if (!docsym) {
        return [];
    }

    // try to parse dependences first.
    sm.parseDependence(uri);

    let defs = [];
    let deps = docsym.dependences();
    deps.forEach(d => {
        let fileManager = file_manager.instance();
        let files = fileManager.getFiles(d.name);
        if (files.length === 0) {
            return;
        }

        // for require('pl.tablex')
        if (d.shortPath) {
            files = files.filter(file => {
                return file.includes(d.shortPath);
            });
        }

        files.forEach(file => {
            let uri = uri_1.file(file).toString();
            let _docsym = sm.documentSymbol(uri);
            if (!_docsym) {
                return;
            }

            defs = defs.concat(_docsym.definitions().filter(d => {
                return !d.islocal;
            }) || []);
        });
        
    });

    return defs;
}

exports.getDefinitionsInDependences = getDefinitionsInDependences;

function filterModDefinitions(defs, ref, compareName) {
    return defs.filter(d => {
        if (!utils_1.inScope(d.scope, ref.location)) {
            return false;
        }

        if (ref.bases.length != d.bases.length) {
            return false;
        }

        if (compareName && ref.name !== d.name) {
            return false;
        }

        for (let i = 0; i < ref.bases.length; i++) {
            if (ref.bases[i] !== d.bases[i]) {
                return false;
            }
            
        }
        return true;
    });
}

exports.filterModDefinitions = filterModDefinitions;

function filterDepDefinitions(defs, ref, compareName) {
    return defs.filter(def => {
        let isInModule = def.container.name !== '_G';
        let offset = 0;

        /* if defined in module, reference should has at least one base and
         * the base is the module name, todo: consider name aliase
         */
        if (isInModule) {
            let moduleName = ref.bases[0];
            if (moduleName !== def.container.name) {
                return false;
            }
            offset = 1;
        }

        if ((ref.bases.length - offset) !== def.bases.length) {
            return false;
        }

        // for definition completion, name is unsed
        if (compareName && ref.name !== def.name) {
            return false;
        }

        for (let i = 0; i < def.bases.length; i++) {
            if (ref.bases[i+offset] !== def.bases[i]) {
                return false;
            }
        }

        return true;
    });
}

exports.filterDepDefinitions = filterDepDefinitions;