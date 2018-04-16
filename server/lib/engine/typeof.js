'use strict';

const { LuaSymbol, BasicTypes } = require('./typedef');

class LazyType {
    constructor(scope, node, name) {
        this.scope = scope;
        this.node = node;
        this.name = name;
    }

    parseLiteral(name, type, range) {
        let symbol = new LuaSymbol(type, name, true, range);
        this.scope.setSymbol(name, symbol);
        return type;
    }

    deduce() {
        let { table, value } = this.scope.searchSymbolUp(this.name);
        if (value) {
            if (value.type instanceof LazyType) {
                return typeOf(value);
            } else {
                return value.type;
            }
        }

        switch (this.node.type) {
            case 'StringLiteral':
                return this.parseLiteral(this.name, BasicTypes.string_t, this.node.range);
            case 'NumericLiteral':
                return this.parseLiteral(this.name, BasicTypes.number_t, this.node.range);
            case 'BooleanLiteral':
                return this.parseLiteral(this.name, BasicTypes.bool_t, this.node.range);
            case 'NilLiteral':
                return this.parseLiteral(this.name, BasicTypes.nil_t, this.node.range);
            case 'StringCallExpression':
            case 'CallExpression':
                break;
            default:
                return this.parseLiteral(this.name, BasicTypes.unkown_t, this.node.range);
        }
    }
};

function newType(scope, node, name) {
    return new LazyType(scope, node, name);
}

function typeOf(symbol) {
    if (!symbol) {
        return null;
    }

    let type = symbol.type;
    if (!(type instanceof LazyType)) {
        return type;
    }

    let deduceType = type.deduce();
    if (deduceType && deduceType != BasicTypes.nil_t && deduceType != BasicTypes.unkown_t) {
        symbol.type = deduceType;
    }

    return deduceType;
}

module.exports = {
    newType,
    typeOf,
}