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
