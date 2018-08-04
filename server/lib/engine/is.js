'use strict';

const { LuaFunction, LuaModule, LuaSymbol, LuaTable, BasicTypes, LazyType } = require('./typedef');

function luatable(t) {
    return t instanceof LuaTable;
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
    return t === BasicTypes.any_t;
}

function lualazy(t) {
    return t instanceof LazyType;
}

module.exports = {
    luafunction, luamodule, luasymbol, luatable, luastring, luanumber, luaboolean, luaany, lualazy
};
