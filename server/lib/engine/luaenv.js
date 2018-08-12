'use strict';

const { LuaTable, LuaSymbol, LuaSymbolKind } = require('./symbol');

const createTableSymbol = (name, loc, range, local) => {
    return new LuaSymbol(name, loc, range, local, null, LuaSymbolKind.table, new LuaTable());
}

const _G = createTableSymbol('_G', [0, 3], [0, Infinity], false);
const _package = createTableSymbol('package', [0, 7], [0, Infinity], false);
_package.type.set('loaded', createTableSymbol('loaded', [0, 6], [0, Infinity], false));
_G.type.set('package', _package);

const LoadedPackages = {};

const global__metatable = createTableSymbol('_G__metatable', [0, 0], [0, Infinity], false);
global__metatable.type.set('__index', _G);

module.exports = {
    _G,
    LoadedPackages,
    global__metatable
}
