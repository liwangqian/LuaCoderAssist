'use strict';

const langserver_1 = require('vscode-languageserver');
const cp_1 = require('child_process');
const walk_1 = require('walk');
const fs_1 = require('fs');
const traits_1 = require('../../lib/symbol/symbol-traits');
const utils_1 = require('../../lib/symbol/utils');
const engine = require('../../lib/engine');

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
        case 'parameter':
            return langserver_1.CompletionItemKind.Property;
        case 'property':
            return langserver_1.CompletionItemKind.Property;
        case 'table':
        case 'class':
            return langserver_1.CompletionItemKind.Class;
        case 'function':
            return langserver_1.CompletionItemKind.Function;
        case 'module':
            return langserver_1.CompletionItemKind.Module;
        default:
            return langserver_1.CompletionItemKind.Variable;
    }
}

exports.mapToCompletionKind = mapToCompletionKind;

function symbolKindDesc(kind) {
    return traits_1.SymbolKind[kind];
}

exports.symbolKindDesc = symbolKindDesc;

function isalpha(c) {
    return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z');
}

function isdigit(c) {
    return c >= '0' && c <= '9';
}

function skip(pattern, content, offset, step) {
    while (pattern.test(content.charAt(offset))) {
        offset += step;
    }
    return offset;
}

function bracketMatches(bracketLeft, bracketRight) {
    switch (bracketLeft) {
        case '(':
            return bracketRight == ')';
        case '[':
            return bracketRight == ']';
        case '{':
            return bracketRight == '}';
        default:
            return false;
    }
}

let rightBracketRegx = /[\)\]\}]/;
let bracketPairsRegx = /[\(\)\[\]\{\}]/;
function backward(content, offset, collection) {
    let isString = false;
    let charIndex = offset;
    let bracketStack = [];
    while (charIndex >= 0) {
        let c = content.charAt(charIndex);
        if (c === '.' || c === ':') {
            if (bracketStack.length === 0) {
                collection.push(c);
            }
            charIndex--;
            charIndex = skip(/\s/, content, charIndex, -1);
            continue;
        }

        if (c == '"' || c == "'") {
            let topChar = bracketStack[bracketStack.length - 1];
            if (topChar == c) {
                bracketStack.pop();
                isString = true;
                if (bracketStack.length === 0) {
                    break;
                }
            } else {
                bracketStack.push(c);
            }
            charIndex--;
            continue;
        }

        if (bracketPairsRegx.test(c)) {
            if (rightBracketRegx.test(c)) {
                bracketStack.push(c);
                charIndex--;
                continue;
            } else {
                let topRightBracket = bracketStack.pop();
                if (bracketMatches(c, topRightBracket)) {
                    charIndex--;
                    continue;
                } else {
                    // error
                    break;
                }
            }
        }

        if (isalpha(c) || isdigit(c) || c === '_') {
            charIndex--;
            if (bracketStack.length === 0) {
                collection.push(c);
            }
            continue;
        }

        if (c === ' ' || c === ',' || c === '\r' || c === '\n' || c === '\r\n' || c === '\n\r') {
            if (bracketStack.length === 0) {
                break;
            }
            charIndex--;
            charIndex = skip(/\s/, content, charIndex, -1);
            continue;
        }

        charIndex--;
    }

    collection.reverse();
    return { offset: charIndex + 1, isString };
}

const forwardRegex = /[a-zA-Z0-9_]/;   // parse only the name
function extendTextRange(content, from, options) {
    let range = { start: from, end: from, text: '', isString: false };
    let offset = from;
    let collection = [];
    if (options.backward) {
        let res = backward(content, offset, collection);
        range.start = res.offset;
        range.isString = res.isString;
        offset = res.offset;
    }

    if (options.forward) {
        offset = from;
        while (offset++ <= content.length) {
            let c = content.charAt(offset);
            if (!forwardRegex.test(c)) {
                range.end = offset;
                break;
            }
            collection.push(c);
        }
    }

    range.text = collection.join('');

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

function documentLineAt(doc, position) {
    let lineBeg = { line: position.line, character: 0 };
    let lineEnd = { line: position.line, character: Infinity };
    return doc.getText({ start: lineBeg, end: lineEnd });
}

const REQUIRE_EXPR_REGEDX = /require\s{0,}\(?\s{0,}[\"|\'](.{0,})[\"|\']\s{0,}\)?/;
function parseRequireExpr(line, cursor, options) {
    let matches = line.match(REQUIRE_EXPR_REGEDX);
    if (!matches || matches.length < 2) {
        return false;
    }

    if ((cursor < (matches.index + 8)) || (cursor >= (matches.index + matches[0].length))) {
        return false;
    }

    return { name: matches[1], completePath: true };
}
function symbolAtPosition(position, doc, options) {
    let cursor = doc.offsetAt(position);

    //for path completion
    let line = documentLineAt(doc, position);
    if (line.length >= 11) { //length of require("")
        let result = parseRequireExpr(line, position.character, options);
        if (result) {
            return result;
        }
    }

    let text = doc.getText();
    let range = extendTextRange(text, cursor, options);
    if (range.start < 0) {
        return undefined;
    }

    let ref = { name: range.text, range: [range.start, range.end], isString: range.isString };
    return ref;
}

exports.symbolAtPosition = symbolAtPosition;

function symbolSignature(symbol, override) {
    let details = [];
    details.push(symbol.isLocal ? 'local ' : '');
    let type = engine.typeOf(symbol);
    if (!type) {
        return details.join('');
    }
    if (type.typeName !== 'function') {
        details.push(symbol.name);
        details.push(' : ', type.typeName);
        return details.join('');
    }

    let returns = type.returns;
    if (!returns && override !== undefined) {
        returns = type.variants[override].returns;
    }
    returns = returns || [];
    let ret = returns.map(item => {
        let typeName = engine.typeOf(item).typeName;
        typeName = typeName.startsWith('@') ? 'any' : typeName;
        return typeName;
    });

    if (type.tailCall) {
        ret.push('...');
    }

    let args = (override !== undefined) ? type.variants[override].args : type.args;
    details.push('function ', symbol.name);
    details.push('(' + args.map(p => p.displayName || p.name).join(', ') + ') -> ');
    details.push(ret.length == 0 ? 'void' : ret.join(', '));
    return details.join('');
}

exports.symbolSignature = symbolSignature;

function functionSnippet(item, symbol, override, selfAsParam) {
    const args = (override === undefined) ? symbol.type.args : symbol.type.variants[override].args;
    if (symbol.type.typeName !== 'function') {
        return;
    }

    let snippet = (override === undefined) ? symbol.type.insertSnippet : symbol.type.variants[override].insertSnippet;
    snippet = snippet || symbol.name + '(' + args.filter(arg => selfAsParam || arg.name !== 'self').map((p, i) => `\${${i + 1}:${p.name}}`).join(', ') + ')';
    item.insertText = snippet;
    item.insertTextFormat = langserver_1.InsertTextFormat.Snippet;
}

exports.functionSnippet = functionSnippet;

function signatureContext(content, offset) {
    function leftBrace(content, offset, lower_bound) {
        let match_brace = 1;
        while (offset-- >= lower_bound && match_brace > 0) {
            let c = content.charAt(offset);
            if (c === ')') {
                match_brace++;
            } else if (c === '(') {
                if (--match_brace === 0) {
                    return offset;
                }
            }
        }

        // 如果没有找到，或者超出了最大搜索字符数，则搜索失败
        return -1;
    }

    function paramIndex(content, offset, lower_bound) {
        let balance = 0;
        let counter = 0;
        while (offset-- > lower_bound) {
            let c = content.charAt(offset);
            if (c === ',' && balance === 0) {
                counter++;
            } else if (c === ')') {
                balance++;
            } else if (c === '(') {
                if (--balance < 0) {
                    // 达到左括号了，结束查找
                    return counter;
                }
            }
        }
        return -1;
    }

    let max_search_char = 200;
    let lower_bound = Math.max(0, offset - max_search_char);

    // 向前搜索，查找offset所在函数的左括号位置
    let end_pos = leftBrace(content, offset, lower_bound);
    end_pos = skip(/\s/, content, end_pos - 1, -1);

    let collection = [];
    let res = backward(content, end_pos, collection);
    let start_pos = res.offset;
    if (start_pos < lower_bound) {
        return undefined;
    }

    let param_id = paramIndex(content, offset, lower_bound);

    return {
        param_id: param_id,
        name: collection.join(''),
        range: [start_pos, end_pos]
    };
}

exports.signatureContext = signatureContext;

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
