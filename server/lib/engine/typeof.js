/******************************************************************************
 *    Copyright 2018 The LuaCoderAssist Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ********************************************************************************/
'use strict';

const _ = require('underscore');
const { LuaBasicTypes, LazyValue, LuaSymbolKind, LuaSymbol, LuaTable } = require('./symbol');
const { StackNode } = require('./linear-stack');
const { LoadedPackages } = require('./luaenv');
const Is = require('./is');
const utils_1 = require('./utils');

/**
 * Deduce the type of the symbol
 * @param {LuaSymbol} symbol the symbol
 */
function typeOf(symbol) {
    if (!symbol) {
        return LuaBasicTypes.any;
    }

    let type = symbol.type;
    let isLazy = Is.lazyValue(type);
    try {
        type = deduceType(type);
    } catch (err) {
        type = LuaBasicTypes.any;
    }

    if (isLazy) {
        if (Is.luaModule(type)) {
            symbol.kind = LuaSymbolKind.module;
        } else if (Is.luaTable(type)) {
            symbol.kind = LuaSymbolKind.class;
        } else if (Is.luaFunction(type)) {
            symbol.kind = LuaSymbolKind.function;
        }
    }

    if (symbol.kind === LuaSymbolKind.parameter && Is.luaAny(type)) {
        return type;
    }

    symbol.type = type;
    return type;
}

function deduceType(type) {
    if (!Is.lazyValue(type)) {
        return type;
    }

    let typeSymbol = parseAstNode(type.node, type);
    return deduceType(typeSymbol) || LuaBasicTypes.any;
}

function mergeType(left, right) {
    let leftType = deduceType(left);
    let rightType = deduceType(right);

    return typeScore(leftType) > typeScore(rightType) ? leftType : rightType;
}

function typeScore(t) {
    if (Is.luaAny(t)) {
        return 0;
    } else if (Is.luaBoolean(t) || Is.luaNumber(t) || Is.luaString(t)) {
        return 1;
    } else if (Is.luaFunction(t)) {
        return 2;
    } else if (Is.luaTable(t)) {
        return 3;
    } else if (Is.luaModule(t)) {
        return 4;
    } else {
        return 0;
    }
}

function parseLogicalExpression(node, type) {
    const context = type.context;
    const name = type.name;
    if (node.operator === 'and') {
        return parseAstNode(node.right, type);
    } else if (node.operator === 'or') {
        return parseAstNode({
            type: 'MergeType',
            left: new LazyValue(context, node.left, name, 0),
            right: new LazyValue(context, node.right, name, 0)
        }, type);
    } else {
        return null;
    }
}

function parseCallExpression(node, type) {
    let ftype = parseMemberExpression(node.base, type);
    if (!Is.luaFunction(ftype)) {
        return null;
    }

    const fname = node.base.name;
    if (fname === 'require') {
        let moduleName = node.arguments[0].value;
        let shortPath = moduleName.replace('.', '/');
        let mdls = LoadedPackages[moduleName]
        // TODO：增加配置项，用来配置搜索路径，然后模拟lua的搜索方法搜索最优匹配模块
        for (const uri in mdls) {
            if (uri.includes(shortPath)) { // 查找最优匹配，如果存在多个最优匹配，则返回第一个
                const ret = mdls[uri].type.return;
                return ret && ret.type;
            }
        }

        return null;
    }

    let R = ftype.returns[type.index || 0];
    if (!Is.lazyValue(R.type)) {
        return R.type;
    }

    // 推导调用参数类型，用来支持推导返回值类型
    const func_argt = node.arguments.map((arg, index) => {
        return { name: ftype.args[index].name, type: parseAstNode(arg, type) };
    });

    let rt = parseForStdlibFunction(node.base.name, func_argt, type);
    if (rt) {
        return rt;
    }

    R.type.context.func_argt = func_argt; // dynamic add

    return typeOf(R); //deduce the type
}

function parseForStdlibFunction(funcName, argsType, type) {
    switch (funcName) {
        case 'setmetatable':
            let table = argsType[0].type;
            if (Is.luaTable(table)) {
                let mt = new LuaSymbol('__mt', null, null, true, type.context.module.uri, LuaSymbolKind.table, argsType[1].type);
                table.setmetatable(mt);
            }
            return table;
        case 'require':
        default:
            break;
    }
}

function parseMemberExpression(node, type) {
    let names = utils_1.baseNames(node);
    let name = names[0];
    let symbol = type.context.search(name, node.range, d => d.name === name);
    if (!symbol) {
        return null;
    }

    let def = symbol;
    for (let i = 1, size = names.length; i < size; ++i) {
        let t = typeOf(def);
        if (!def || !(Is.luaTable(t) || Is.luaModule(t))) {
            return null;
        }
        const name = names[i];
        def = t.search(name, node.base.range).value;
    }

    return typeOf(def);
}

function parseUnaryExpression(node) {
    switch (node.operator) {
        case '#':
        case '-': // -123
            return LuaBasicTypes.number;
        case 'not': // not x
            return LuaBasicTypes.boolean;
        default:
            return null;
    }
}

function parseBinaryExpression(node, type) {
    switch (node.operator) {
        case '..':
            return LuaBasicTypes.string;
        case '==':
        case '~=':
        case '>':
        case '<':
        case '>=':
        case '<=':
            return LuaBasicTypes.boolean;
        case '+':
        case '-':
        case '*':
        case '^':
        case '/':
        case '%':
            return parseAstNode(node.right, type);
        default:
            return null;
    }
}

function parseTableConstructorExpression(node, type) {
    let table = new LuaTable();
    node.fields.forEach(field => {
        if (field.type !== 'TableKeyString') {
            return;
        }

        let name = field.key.name;
        let ft = parseAstNode(field.value, type);
        let fs = new LuaSymbol(name, field.key.range, node.range, true, type.context.module.uri, LuaSymbolKind.property, ft);
        table.set(name, fs);
    });
    return table;
}

function parseIdentifier(node, type) {
    let func_argt = type.context.func_argt;
    let identType;
    func_argt && func_argt.forEach(argt => {
        if (argt.name === node.name) {
            identType = argt.type;
        }
    });
    if (identType && !Is.luaAny(identType)) {
        return identType;
    }

    let symbol = type.context.search(node.name);
    return symbol && typeOf(symbol);
}

function parseVarargLiteral(node, type) {
    return parseIdentifier({ name: node.value }, type);
}

function parseAstNode(node, type) {
    if (!node) return null;
    switch (node.type) {
        case 'StringLiteral':
            return LuaBasicTypes.string;
        case 'NumericLiteral':
            return LuaBasicTypes.number;
        case 'BooleanLiteral':
            return LuaBasicTypes.boolean;
        case 'NilLiteral':
            return LuaBasicTypes.any;
        case 'Identifier':
            return parseIdentifier(node, type);
        case 'UnaryExpression':
            return parseUnaryExpression(node, type);
        case 'BinaryExpression':
            return parseBinaryExpression(node, type);
        case 'MemberExpression':
            return parseMemberExpression(node, type);
        case 'StringCallExpression':
        case 'CallExpression':
            return parseCallExpression(node, type);
        case 'LogicalExpression':
            return parseLogicalExpression(node, type);
        case 'TableConstructorExpression':
            return parseTableConstructorExpression(node, type);
        // case 'FunctionDeclaration':
        //     return parseFunctionDeclaration(node, type);
        case 'VarargLiteral':
            return parseVarargLiteral(node, type);
        case 'MergeType':
            return mergeType(node.left, node.right);
        default:
            return null;
    }
}

/**
 * Search the most inner scope of range
 * @param {LinearStack} stack root scope to begin search
 * @param {Number[]} location [start, end]
 */
function searchInnerStackIndex(stack, location) {
    let refNode = new StackNode({ location });
    return _.sortedIndex(stack.nodes, refNode, (node) => {
        return node.data.location[0] - location[0];
    });
}

/**
 * Find the definition of symbol with name in document(uri)
 * @param {String} name symbol name 
 * @param {String} uri uri of the document
 * @param {Array<Number>} range range of the reference
 * @return {LuaSymbol} The symbol
 */
function findDef(name, uri, range) {
    let theModule = LoadedPackages[uri]
    if (!theModule) {
        return null;
    }
    return theModule.type.search(name, range, (data) => {
        return data.name === name
    }).value;
}


module.exports = {
    typeOf,
    findDef,
    deduceType,
    searchInnerStackIndex
}