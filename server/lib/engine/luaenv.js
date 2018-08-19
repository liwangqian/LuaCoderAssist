'use strict';

const { LuaTable, LuaSymbol, LuaSymbolKind } = require('./symbol');

const createTableSymbol = (name, loc, range, local) => {
    return new LuaSymbol(name, loc, range, local, null, LuaSymbolKind.table, new LuaTable());
}

const _G = createTableSymbol('_G', [0, 3], [0, Infinity], false);
const LoadedPackages = {};

const global__metatable = createTableSymbol('_G__metatable', [0, 0], [0, Infinity], false);
global__metatable.set('__index', _G);

module.exports = {
    _G,
    LoadedPackages,
    global__metatable
}
