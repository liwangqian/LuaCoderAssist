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
    LuaModule,
    LuaTable,
    LuaFunction,
    LuaBasicTypes,
    LuaSymbol,
    LuaSymbolKind,
    lazyType,
    LuaNameType
} = require('./symbol');
const { namedTypes, _G, LoadedPackages } = require('./luaenv');
const fs_1 = require('fs');

let state = undefined;

function loadExtentLib(filePath, moduleName) {
    fs_1.readFile(filePath, 'utf8', (error, data) => {
        if (!error) {
            const lib = JSON.parse(data);
            state = undefined; /*namedTypes不需要state*/
            parseNamedTypes(lib);
            parseModule(lib, moduleName);
        }
    });
}

exports.loadExtentLib = loadExtentLib;

const newExtentSymbol = (name, isLocal, kind, type) => {
    let newSymbol = new LuaSymbol(name, null, null, isLocal, null, kind, type);
    newSymbol.state = state;
    return newSymbol;
}

function parseNamedTypes(json) {
    if (!json || !json.namedTypes) {
        return;
    }

    const types = json.namedTypes;
    if (!(types instanceof Object)) {
        return;
    }

    for (const name in types) {
        const value = types[name];
        const symbol = parseJsonObject(value, name);
        symbol.type.typeName = name;
        symbol && namedTypes.set(name, symbol);
    }
}

function parseModule(json, moduleName) {
    if (!json || !json.global) {
        return;
    }

    const global = json.global;
    if (global.type !== 'table') {
        return;
    }

    const fields = global.fields;
    if (!(fields instanceof Object)) {
        return;
    }

    state = { valid: true }; /*每个外部lib使用独立的state*/
    let theModule;
    if (moduleName) {
        /*创建一个module来保存外部lib符号*/
        theModule = newExtentSymbol(moduleName, false, LuaSymbolKind.module, new LuaModule());
        theModule.state = state;
    }

    for (const name in fields) {
        const value = fields[name];
        const symbol = parseJsonObject(value, name);
        if (symbol) {
            _G.set(name, symbol);
            theModule && theModule.set(name, symbol);
        }
    }

    if (theModule) {
        /*保存module起来用于支持动态加载和卸载*/
        LoadedPackages[moduleName] = theModule;
    }
}

/**
 * Parse the json format interface desc data.
 * @param {*} node JSON object 
 * @param {String} name Name of the node
 * 
 * @returns {LuaSymbol}
 */
function parseJsonObject(node, name) {
    if (!node) {
        return undefined;
    }

    if (!name && (node instanceof Object)) {
        const object = {};
        for (const key in node) {
            const value = node[key];
            const symbol = parseJsonObject(value, key);
            symbol && (object[key] = symbol);
        }
        return object;
    }

    switch (node.type) {
        case 'table':
            return parseTableJsonObject(node, name);
        case 'function':
            return parseFunctionJsonObject(node, name);
        case 'ref':
            return parseRefJsonObject(node, name);
        case 'string':
        case 'number':
        case 'boolean':
            return parseLuaBasicTypeJsonObject(node, name);
        default:
            return newExtentSymbol(name, false, LuaSymbolKind.variable, new LuaNameType(node.type));
    }
}

function parseTableJsonObject(node, name) {
    let table = new LuaTable();
    table._fields = parseJsonObject(node.fields);
    table._metatable = parseJsonObject(node.metatable, '__mt');
    table.description = node.description;
    table.link = node.link;
    let symbol = newExtentSymbol(name, false, LuaSymbolKind.table, table);
    return symbol;
}

function parseFunctionJsonObject(node, name) {
    let func = new LuaFunction();
    func.description = node.description;
    func.link = node.link;
    func.insertSnippet = node.insertSnippet;
    func.args = parseArgumentsObject(node.args);
    func.returns = parseReturnsObject(node.returnTypes);
    parseVariantsArgumentsObject(node.variants, func);
    let symbol = newExtentSymbol(name, false, LuaSymbolKind.function, func);
    return symbol;
}

function parseVariantsArgumentsObject(variants, func) {
    if (!variants) {
        return;
    }

    func.variants = variants.map(variant => {
        return {
            description: variant.description || '',
            args: parseArgumentsObject(variant.args),
            returns: parseReturnsObject(variant.returnTypes)
        };
    });
}

function parseArgumentsObject(args) {
    if (!args) {
        return [];
    }
    return args.map(arg => {
        const symbol = newExtentSymbol(arg.name, true, LuaSymbolKind.parameter, LuaBasicTypes.any);
        symbol.displayName = arg.displayName;
        return symbol;
    });
}

function parseReturnsObject(returns) {
    if (!returns) {
        return undefined;
    }
    return returns.map((rt, index) => {
        return parseJsonObject(rt, rt.name || `R${index}`);
    });
}

function parseLuaBasicTypeJsonObject(node, name) {
    const type = LuaBasicTypes[node.type];
    const symbol = newExtentSymbol(name, false, LuaSymbolKind.variable, type);
    return symbol;
}

function parseRefJsonObject(node, name) {
    const type = lazyType(null, node, name, 0); //delay evaluate
    const symbol = newExtentSymbol(name, false, LuaSymbolKind.variable, type);
    return symbol;
}
