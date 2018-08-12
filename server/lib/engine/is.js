'use strict';

const {
    LuaTable,
    LuaFunction,
    LuaModule,
    LuaBasicTypes,
    LazyValue
} = require('./symbol');

function luaTable(t) {
    return t instanceof LuaTable;
}

function luaFunction(t) {
    return t instanceof LuaFunction;
}

function luaModule(t) {
    return t instanceof LuaModule;
}

function luaString(t) {
    return t === LuaBasicTypes.string;
}

function luaBoolean(t) {
    return t === LuaBasicTypes.boolean;
}

function luaNumber(t) {
    return t === LuaBasicTypes.number;
}

function luaAny(t) {
    return t === LuaBasicTypes.any;
}

function lazyValue(t) {
    return t instanceof LazyValue;
}

module.exports = {
    luaFunction,
    luaModule,
    luaTable,
    luaString,
    luaNumber,
    luaBoolean,
    luaAny,
    lazyValue
};
