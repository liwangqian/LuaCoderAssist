'use strict';

const langserver_1 = require('vscode-languageserver');
const cp_1 = require('child_process');
const walk_1 = require('walk');
const fs_1 = require('fs');
const uri_1 = require('vscode-uri').default;
const traits_1 = require('../../lib/symbol/symbol-traits');
const utils_1 = require('../../lib/symbol/utils');
const symbol_manager = require('./symbol-manager');
const file_manager = require('./file-manager');

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
    const buffer = cp_1.execFileSync("lua", ["-e", program], { cwd: cwd });
    return JSON.parse(buffer.toString());
}

exports.loadConfig = loadConfig;

function fileSize(filePath) {
    return fs_1.statSync(filePath).size;
}

exports.fileSize = fileSize;


function findSymbol(position, symbols) {
    var line = position.line;
    var character = position.character;
    var symbol = null;

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
    var offsetEnd = document.offsetAt(position);
    var offsetStart = document.offsetAt({ line: position.line, character: 0 });
    return document.getText().substring(offsetStart, offsetEnd);
}

exports.lineContent = lineContent;

function mapSymbolKind(kind) {
    switch (kind) {
        case traits_1.SymbolKind.function: return langserver_1.SymbolKind.Function;
        case traits_1.SymbolKind.class: return langserver_1.SymbolKind.Class;
        case traits_1.SymbolKind.module: return langserver_1.SymbolKind.Module;
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
const forwardRegex = /[a-zA-Z0-9_]/;   // parse only the name
function extendTextRange(content, from, options) {
    let range = { start: from, end: from };

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
    var result = { name: "", bases: [] };
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
    let text = doc.getText();
    let range = extendTextRange(text, cursor, options);
    if (range.start < 0) {
        return undefined;
    }

    // let ref = parseContext(text.substring(range.start, range.end));
    let ref = { name: text.substring(range.start, range.end), range: [range.start, range.end] };
    // ref.location = { start: position, end: position };    // used for scope filter

    return ref;
}

exports.symbolAtPosition = symbolAtPosition;

function functionSignature(symbol) {
    if (symbol.kind != traits_1.SymbolKind.function) {
        return undefined;
    }
    let baseName = symbol.bases[symbol.bases.length - 1];
    let signature = (baseName ? (baseName + '.') : '') + symbol.name + '(' + symbol.params.join(', ') + ')';
    return signature;
}

exports.functionSignature = functionSignature;

function findDefByNameAndScope(name, location, defs) {
    for (let i = 0; i < defs.length; i++) {
        let d = defs[i];
        if (name === d.name && utils_1.inScope(d.scope, location)) {
            return d;
        }
    }

    return undefined;
}

function getDefinitionsInDependences(uri, ref, tracer) {
    let sm = symbol_manager.instance();
    let docsym = sm.documentSymbol(uri);
    if (!docsym) {
        return [];
    }

    let baseSymbol = undefined;
    let base = ref.bases[0];
    // 如果是base.property这种表达式，则尝试进行精确匹配
    if (base) {
        // 先查看依赖的模块名，如果base==depName，则符号肯定是从模块depName中获取
        baseSymbol = findDefByNameAndScope(base, ref.location, docsym.dependences());
        // 如果不在依赖的模块里面，再看下是否有本地定义，解决local x = require("mm")的问题，
        // 此时，base === x.alias === 'mm'
        if (!baseSymbol) {
            baseSymbol = findDefByNameAndScope(base, ref.location, docsym.definitions());
        }
    }

    // 线尝试解析依赖模块的符号，这个是性能点，后续考虑优化
    sm.parseDependence(uri);

    let defs = [];
    let deps = docsym.dependences();
    deps.filter(d => {
        // 根据前面的计算，尝试进行精确匹配
        return baseSymbol ? (d.name === baseSymbol.name || d.name === baseSymbol.alias)
            : true;
    }).forEach(d => {
        let fileManager = file_manager.instance();
        let files = fileManager.getFiles(d.name);
        if (files.length === 0) {
            return;
        }

        // for require('pl.tablex')，精准匹配
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

            let exportSymbols = _docsym.isReturnMode() ? _docsym.returns() : _docsym.definitions();
            defs = defs.concat(exportSymbols.filter(d => {
                return (d.returnMode === true) || !d.islocal;
            }) || []);
        });
    });

    return defs;
}

exports.getDefinitionsInDependences = getDefinitionsInDependences;

function fuzzyCompareName(srcName, dstName) {
    return dstName.includes(srcName);
}

exports.fuzzyCompareName = fuzzyCompareName;

function preciseCompareName(srcName, dstName) {
    return srcName === dstName;
}

exports.preciseCompareName = preciseCompareName;

function filterModDefinitions(defs, ref, compareName) {
    return defs.filter(d => {
        if (!utils_1.inScope(d.scope, ref.location)) {
            return false;
        }

        if (ref.bases.length != d.bases.length) {
            return false;
        }

        if (!compareName(ref.name, d.name)) {
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
        let isInModule = (def.container.name !== '_G') && (def.returnMode !== true);
        let offset = 0;

        /* if defined in module, reference should has at least one base and
         * the base is the module name, todo: consider name aliase
         */
        if (isInModule) {
            let moduleName = ref.bases[0];
            // TODO: 增加alias的支持，需要查找moduleName这个符号的定义，然后判断def.alias === def.container.name
            if (moduleName !== def.container.name) {
                // let module = findDefByNameAndScope(moduleName, ref.location, docsym.definitions());
                return false;
            }
            offset = 1;
        }

        if ((ref.bases.length - offset) !== def.bases.length) {
            return false;
        }

        // 对于符号补全，不需要比较符号的名字，只要bases一样就行
        if (!compareName(ref.name, def.name)) {
            return false;
        }

        // 如果是通过return表达式返回的符号，第一个base的名字不需要比较
        let startIndex = 0;
        if (def.returnMode === true && ref.bases.length > 0) {
            startIndex = 1;
        }

        for (let i = startIndex; i < def.bases.length; i++) {
            if (ref.bases[i + offset] !== def.bases[i]) {
                return false;
            }
        }

        return true;
    });
}

exports.filterDepDefinitions = filterDepDefinitions;

function findAllReferences(references, def) {
    return references.filter(r => {
        if (r.bases.length !== def.bases.length) {
            return false;
        }

        if (r.name !== def.name) {
            return false;
        }

        if (!utils_1.inScope(def.scope, r.location)) {
            return false;
        }

        for (let i = 0; i < r.bases.length; i++) {
            if (r.bases[i] !== def.bases[i]) {
                return false;
            }
        }

        return true;
    });
}

exports.findAllReferences = findAllReferences;
