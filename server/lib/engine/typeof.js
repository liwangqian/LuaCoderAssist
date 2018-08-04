'use strict';

const _ = require('underscore');
const { BasicTypes, LazyType } = require('./typedef');
const { StackNode } = require('./linear-stack');
const Is = require('./is');
const { Package } = require('./luaenv');

/**
 * 
 * @param {LuaSymbol} symbol the symbol
 */
function typeOf(symbol) {
    if (!symbol) {
        return BasicTypes.any_t;
    }

    let type
    try {
        type = deduceType(symbol.type);
    } catch (err) {
        type = BasicTypes.any_t;
    }

    symbol.type = deduceType(type); // once again
    return symbol.type;
}

function deduceType(type) {
    if (!Is.lualazy(type)) {
        return type;
    }

    const value = type.context.search(type.name);
    let namedType = value && value.type;
    if (namedType) {
        return namedType;
    }

    let typeSymbol = parseAstNode(type.node, type);
    return typeSymbol || BasicTypes.any_t;
}

function mergeType(left, right) {
    let leftType = deduceType(left);
    let rightType = deduceType(right);

    return typeScore(leftType) > typeScore(rightType) ? leftType : rightType;
}

function typeScore(t) {
    if (Is.luaany(t)) {
        return 0;
    } else if (Is.luaboolean(t) || Is.luanumber(t) || Is.luastring(t)) {
        return 1;
    } else if (Is.luafunction(t)) {
        return 2;
    } else if (Is.luatable(t)) {
        return 3;
    } else if (Is.luamodule(t)) {
        return 4;
    } else {
        return 0;
    }
}

function parseLogicalExpression(node, type) {
    const scope = type.scope;
    const name = type.name;
    if (node.operator === 'and') {
        return parseLogicalExpression(node.right, type);
    } else if (node.operator === 'or') {
        let leftNode = parseLogicalExpression(node.left, type);
        let rightNode = parseLogicalExpression(node.right, type);
        return parseAstNode({
            type: 'MergeType',
            left: new LazyType(scope, leftNode, name),
            right: new LazyType(scope, rightNode, name)
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
    if (!Is.luafunction(ftype)) {
        return null;
    }

    let R = ftype.returns[type.index || 0];
    return typeOf(R); //deduce the type
}

function parseMemberExpression(node, type) {
    let names = extractBasesName(node);
    let name = names[0];
    let symbol = type.context.search(name);
    if (!symbol) {
        return null;
    }

    let def = symbol;
    for (let i = 1, size = names.length; i < size; ++i) {
        let t = typeOf(def);
        if (!def || !(Is.luatable(t) || Is.luamodule(t))) {
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
            return BasicTypes.number_t;
        case 'not': // not x
            return BasicTypes.bool_t;
        default:
            return null;
    }
}

function parseBinaryExpression(node, type) {
    switch (node.operator) {
        case '..':
            return BasicTypes.string_t;
        case '==':
        case '~=':
        case '>':
        case '<':
        case '>=':
        case '<=':
            return BasicTypes.bool_t;
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
    let { value } = type.scope.search(node.name);
    return value && typeOf(value.type);
}

function parseAstNode(node, type) {
    if (!node) return null;
    switch (node.type) {
        case 'StringLiteral':
            return BasicTypes.string_t;
        case 'NumericLiteral':
            return BasicTypes.number_t;
        case 'BooleanLiteral':
            return BasicTypes.bool_t;
        case 'NilLiteral':
            return BasicTypes.any_t;
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
 * @param {Array<Number>} location [start, end]
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
    let theModule = Package.loaded.get(uri);
    if (!theModule) {
        return null;
    }

    let stack = theModule.type.stack;
    let index = searchInnerStackIndex(stack, range);
    return stack.search((data) => data.name === name, index);
}


module.exports = {
    typeOf,
    findDef,
    searchInnerStackIndex
}