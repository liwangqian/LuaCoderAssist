/******************************************************************************
 *    Copyright 2018 The LuaCoderAssist Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ********************************************************************************/
'use strict';

const { LuaTable, LuaSymbol, LuaSymbolKind } = require('./symbol');

const createTableSymbol = (name, loc, range, local) => {
    return new LuaSymbol(name, loc, range, local, null, LuaSymbolKind.table, new LuaTable());
}

const _G = createTableSymbol('_G', [0, 3], [0, Infinity], false);
_G.state = { valid: true };
const LoadedPackages = {};

const global__metatable = createTableSymbol('_G__metatable', [0, 0], [0, Infinity], false);
global__metatable.state = { valid: true };
global__metatable.set('__index', _G);

module.exports = {
    _G,
    LoadedPackages,
    global__metatable
}
