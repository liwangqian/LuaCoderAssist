'use strict';

const _ = require('underscore');
const { LuaSymbol, BasicTypes, LazyType, LuaFunction, LuaScope } = require('./typedef');
const { _G, Package } = require('./luaenv');

/**
 * 
 * @param {LuaSymbol} symbol the symbol
 */
function typeOf(symbol) {
    if (!symbol) {
        return BasicTypes.unkown_t;
    }

    let type = symbol.type;
    if (!(type instanceof LazyType)) {
        return type;
    }

    let typeSymbol = parseAstNode(type.node, type.name);
    if (typeSymbol) {
        type.scope.set(type.name, typeSymbol);
        symbol.type = typeSymbol.type;
        return symbol.type;
    }

    const { value } = type.scope.search(type.name);
    return (value && value.type) || BasicTypes.unkown_t;
}

function parseAstNode(node, name) {
    switch (node.type) {
        case 'StringLiteral':
            return new LuaSymbol(BasicTypes.string_t, name, true, node.range);
        case 'NumericLiteral':
            return new LuaSymbol(BasicTypes.number_t, name, true, node.range);
        case 'BooleanLiteral':
            return new LuaSymbol(BasicTypes.bool_t, name, true, node.range);
        case 'NilLiteral':
            return new LuaSymbol(BasicTypes.nil_t, name, true, node.range);
        case 'StringCallExpression':
        case 'CallExpression':
            // return the returns of the function 
            if (node.base.name === 'tostring') {
                return new LuaSymbol(BasicTypes.string_t, name, true, node.range);
            }
            break;
        default:
            return null;
    }
}

function returnType(functionSymbol, params, index) {
    if (!(functionSymbol instanceof LuaSymbol)) {
        return BasicTypes.unkown_t;
    }

    if (!(functionSymbol.type instanceof LuaFunction)) {
        return BasicTypes.unkown_t;
    }

    switch (functionSymbol.name) {
        case 'require':
            let mname = params[0];

            break;

        default:
            break;
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