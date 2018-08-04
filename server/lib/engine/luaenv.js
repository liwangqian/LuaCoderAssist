'use strict';

const { LuaTable, LuaSymbol, MultiMap } = require('./typedef');
// const { Scope } = require('./linear-stack');


let _G = new LuaSymbol(new LuaTable(), '_G', false, null);

let Package = {
    loaded: new Map(),
    uriMap: new MultiMap()
}

module.exports = {
    _G,
    Package
};



