'use strict';

const { LuaScope, LuaFunction, LuaModule, LuaSymbol, LuaTable } = require('./typedef');

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

module.exports = {
    luafunction, luamodule, luascope, luasymbol, luatable
};
