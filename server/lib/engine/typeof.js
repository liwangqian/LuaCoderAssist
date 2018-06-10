'use strict';

const _ = require('underscore');
const { LuaSymbol, BasicTypes, LazyType, LuaScope } = require('./typedef');
const Is = require('./is');
const { Package } = require('./luaenv');

/**
 * 
 * @param {LuaSymbol} symbol the symbol
 */
function typeOf(symbol) {
    if (!symbol) {
        return BasicTypes.unkown_t;
    }

    let type = deduceType(symbol.type);
    symbol.type = type;
    return type;
}

function deduceType(type) {
    if (!(type instanceof LazyType)) {
        return type;
    }

    const { value } = type.scope.search(type.name);
    let namedType = value && value.type;
    if (namedType) {
        return namedType;
    }

    let typeSymbol = parseAstNode(type.node, type);
    return typeSymbol && typeSymbol.type || BasicTypes.unkown_t;
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
        return {
            type: 'MergeType',
            left: new LazyType(scope, leftNode, name),
            right: new LazyType(scope, rightNode, name)
        };
    } else {
        return node;
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
    let def = parseMemberExpression(node.base, type);
    if (!Is.luafunction(typeOf(def))) {
        return null;
    }

    let R = def.type.returns[type.index || 0];
    typeOf(R); //deduce the type
    return R;
}

function parseMemberExpression(node, type) {
    let names = extractBasesName(node);
    let name = names[0];
    let { value } = type.scope.search(name);
    if (!value) {
        return null;
    }

    let def = value;
    for (let i = 1, size = names.length; i < size; ++i) {
        let t = typeOf(def);
        if (!def || !(Is.luatable(t) || Is.luamodule(t))) {
            return null;
        }
        const name = names[i];
        def = t.get(name);
    }

    return def;
}

function parseAstNode(node, type) {
    const name = type.name;
    switch (node.type) {
        case 'StringLiteral':
            return new LuaSymbol(BasicTypes.string_t, name, true, node.range);
        case 'NumericLiteral':
            return new LuaSymbol(BasicTypes.number_t, name, true, node.range);
        case 'BooleanLiteral':
            return new LuaSymbol(BasicTypes.bool_t, name, true, node.range);
        case 'NilLiteral':
            return new LuaSymbol(BasicTypes.nil_t, name, true, node.range);
        case 'MemberExpression':
            return parseMemberExpression(node, type);
        case 'StringCallExpression':
        case 'CallExpression':
            return parseCallExpression(node, type);
        case 'LogicalExpression':
            return parseAstNode(parseLogicalExpression(node, type), type);
        case 'MergeType':
            return new LuaSymbol(mergeType(node.left, node.right), name, true, node.range);
        default:
            return null;
    }
}

/**
 * Search the most inner scope of range
 * @param {LuaScope} rootScope root scope to begin search
 * @param {Array<Number>} range [start, end]
 */
function searchInnerScope(rootScope, range) {
    let targetScope = rootScope;
    let refScope = new LuaScope(range);

    /**
     * @param {LuaScope} scope 
     */
    const _search = (scope) => {
        if (!scope || !scope.inScope(range)) {
            return;
        }

        let _scopeIndex = _.sortedIndex(scope.subScopes, refScope, (elem) => {
            return elem.range[0] - range[0];
        });

        let _scope = scope.subScopes[_scopeIndex - 1];
        if (!_scope) {
            return;
        }

        targetScope = _scope;
        return _search(_scope);
    }

    _search(rootScope);
    return targetScope;
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

    let scope = searchInnerScope(theModule.type.scope, range);
    let { value } = scope.search(name);
    return value;
}


module.exports = {
    typeOf,
    findDef,
    searchInnerScope
}