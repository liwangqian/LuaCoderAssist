'use strict';

const { LuaSymbol, BasicTypes, LazyType } = require('./typedef');

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
            break;
        default:
            return null;
    }
}


module.exports = {
    typeOf
}