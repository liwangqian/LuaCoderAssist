'use strict';

const _ = require('underscore');
const { LuaBasicTypes, LazyValue } = require('./symbol');
const { StackNode } = require('./linear-stack');
const { LoadedPackages } = require('./luaenv');
const Is = require('./is');
const utils_1 = require('./utils');

/**
 * 
 * @param {LuaSymbol} symbol the symbol
 */
function typeOf(symbol) {
    if (!symbol) {
        return LuaBasicTypes.any;
    }

    let type
    try {
        type = deduceType(symbol.type);
    } catch (err) {
        type = LuaBasicTypes.any;
    }

    symbol.type = deduceType(type); // once again
    return symbol.type;
}

function deduceType(type) {
    if (!Is.lazyValue(type)) {
        return type;
    }

    const value = type.context.search(type.name);
    let namedType = value && value.type;
    if (namedType) {
        return namedType;
    }

    let typeSymbol = parseAstNode(type.node, type);
    return typeSymbol || LuaBasicTypes.any;
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

function extractBasesName(node) {
    let bases = [];
    const _walk = (base) => {
        if (!base) return;
        _walk(base.base);
        bases.push(base.name || base.identifier.name);
    }
    _walk(node);
    return bases;
}

function parseCallExpression(node, type) {
    let ftype = parseMemberExpression(node.base, type);
    if (!Is.luaFunction(ftype)) {
        return null;
    }

    let R = ftype.returns[type.index || 0];
    return typeOf(R); //deduce the type
}

function parseMemberExpression(node, type) {
    let names = utils_1.baseNames(node);
    let name = names[0];
    let symbol = type.context.search(name);
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
        def = t.get(name);
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
            return LuaBasicTypes.bool;
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

function parseIdentifier(node, type) {
    let symbol = type.context.search(node.name);
    return symbol && typeOf(symbol);
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
 * 
 * @param {String} name symbol name 
 * @param {String} uri uri of the document
 * @param {Array<Number>} range range of the reference
 */
function findDef(name, uri, range) {
    let theModule = LoadedPackages[uri]
    if (!theModule) {
        return null;
    }
    return theModule.type.menv.search(name, range, (data) => {
        return data.name === name
    });
}


module.exports = {
    typeOf,
    findDef,
    searchInnerStackIndex
}