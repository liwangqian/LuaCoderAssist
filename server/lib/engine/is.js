'use strict';

const { LuaScope, LuaFunction, LuaModule, LuaSymbol, LuaTable, BasicTypes } = require('./typedef');

function luatable(t) {
    return t instanceof LuaTable;
}

function luascope(t) {
    return t instanceof LuaScope;
}

function luafunction(t) {
    return t instanceof LuaFunction;
}

function luamodule(t) {
    return t instanceof LuaModule;
}

function luasymbol(t) {
    return t instanceof LuaSymbol;
}

function luastring(t) {
    return t === BasicTypes.string_t;
}

function luaboolean(t) {
    return t === BasicTypes.bool_t;
}

function luanumber(t) {
    return t === BasicTypes.number_t;
}

function luaany(t) {
    return t === BasicTypes.nil_t || t === BasicTypes.unkown_t;
}


module.exports = {
    luafunction, luamodule, luascope, luasymbol, luatable, luastring, luanumber, luaboolean, luaany
};
