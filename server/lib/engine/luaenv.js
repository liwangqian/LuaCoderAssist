'use strict';

const { LuaScope, LuaTable, LuaSymbol, MultiMap } = require('./typedef');

let _G = new LuaSymbol(new LuaTable(), '_G', false, null);
_G.scope = new LuaScope([0, Infinity]);

let Package = {
    loaded: new Map(),
    uriMap: new MultiMap()
}

module.exports = {
    _G,
    Package
};



