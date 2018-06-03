'use strict';

const _ = require('underscore');
const { LuaSymbol, BasicTypes, LazyType, LuaFunction, LuaScope } = require('./typedef');
const { _G, Package } = require('./luaenv');

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
 * search definition of the symbol
 */
function findDef(name, uri, range) {
    let theModule = Package.loaded.get(uri);
    if (!theModule) {
        return null;
    }

    let refScope = new LuaScope(range);
    let rootScope = theModule.type.scope;
    let def = null;

    const _search = (scope) => {
        if (!scope || !scope.inScope(range)) {
            return;
        }

        /**
         * 查找最内层作用域的定义
         */
        let _scopeIndex = _.sortedIndex(scope.subScopes, refScope, (elem) => {
            return elem.range[0] - range[0];
        });

        let _scope = scope.subScopes[_scopeIndex - 1];
        _search(_scope);

        def = def || scope.get(name);
        return true;
    }

    _search(rootScope);

    /*找不到局部作用域的定义，再找全局域*/
    def = def || _G.type.get(name);
    return def;
}


module.exports = {
    typeOf,
    findDef
}