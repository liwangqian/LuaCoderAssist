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

const { LoadedPackages, _G } = require('./luaenv');
const { object2Array } = require('./utils');
const { typeOf, findDef, searchInnerStackIndex } = require('./typeof');
const { ScopeEnd } = require('./linear-stack');
const Is = require('./is');

class CompletionContext {
    /**
     * 
     * @param {String} expr completion expression, eg. `abc.def:hg()` => `abc:def:gh`
     * @param {Array<Number>} range 
     * @param {String} uri 
     */
    constructor(expr, range, uri) {
        this.expr = expr;
        this.names = expr.trim().split(/[\.\:]/);
        this.range = range;
        this.uri = uri;
        this.isString = false;
        this.functionOnly = expr.lastIndexOf(':') > expr.lastIndexOf('.');
    }
};


let completionMapCache = new Map();
/**
 * Provide completion items
 * @param {CompletionContext} context 
 */
function completionProvider(context) {
    const namesLength = context.names.length;
    let theModule = LoadedPackages[context.uri];
    if (!theModule || namesLength === 0) {
        return [];
    }

    let stack = theModule.type.menv.stack;
    let index = searchInnerStackIndex(stack, context.range);
    let skipNode = (node) => ScopeEnd.is(node);

    //Case: abc
    if (namesLength === 1) {
        completionMapCache = new Map();
        let node = stack.nodes[index - 1];
        while (node) {
            const name = node.data.name;
            !skipNode(node) && !completionMapCache.has(name) && completionMapCache.set(name, node.data);
            node = node.prev;
        };

        theModule.type.walk(fields => {
            for (const name in fields) {
                const symbol = fields[name];
                !completionMapCache.has(name) && completionMapCache.set(name, symbol);
            }
        });

        let symbolArray = [];
        completionMapCache.forEach(value => {
            symbolArray.push(value);
        });

        return symbolArray;
    }

    //Case: abc.x or abc.xy:z ...
    //TODO: support abc().xx
    const name = context.names[0];
    let value = completionMapCache.get(name);
    if (!value) {
        value = findDef(name, context.uri, context.range);
    }

    if (name.length === 0 && context.isString) {
        value = _G.get('string');
    }

    if (!value) {
        return [];
    }

    if (Is.luaFunction(typeOf(value))) {
        if (!value.type.returns) {
            return [];
        }
        value = value.type.returns[0];
    }

    if (!value) {
        return [];
    }

    if (Is.luaString(value.type)) {
        value = _G.get('string');
    }

    if (!Is.luaTable(typeOf(value)) && !Is.luaModule(value)) {
        return [];
    }

    let def = value;
    const size = namesLength - 1;
    for (let i = 1; i < size; ++i) {
        let name = context.names[i];
        def = def.type.search(name, context.range).value;
        if (!def) {
            return [];
        }

        let type = typeOf(def);

        // func().abc
        if (Is.luaFunction(type)) {
            if (!type.returns) {
                return [];
            }
            def = type.returns[0];
            type = typeOf(def);
        }

        if (Is.luaString(type) && _G.get('string')) {
            def = _G.get('string');
            type = def.type;
        }

        if (Is.luaTable(type)) {
            continue;
        } else {
            return [];
        }
    }

    const filter = item => context.functionOnly && !Is.luaFunction(item.type);
    let children
    if (Is.luaModule(def.type)) {
        children = def.type.fields;
    } else {
        children = Object.create(null);
        def.type.walk(fields => {
            Object.assign(children, fields);
        });
    }

    return object2Array(def.type.return || children, filter);
}

module.exports = {
    CompletionContext, completionProvider
}
