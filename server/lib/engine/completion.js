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

const { LoadedPackages } = require('./luaenv');
const { object2Array } = require('./utils');
const { typeOf, searchInnerStackIndex } = require('./typeof');
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
        this.functionOnly = expr.endsWith(':');
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
    if (!Is.luaTable(typeOf(value)) && !Is.luaModule(value)) {
        return [];
    }

    let def = value;
    const size = namesLength - 1;
    for (let i = 1; i < size; ++i) {
        let name = context.names[i];
        def = def.type.get(name);
        if (!def || !Is.luaTable(typeOf(def))) {
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
            for (const name in fields) {
                const symbol = fields[name];
                if (!children[name]) {
                    children[name] = symbol;
                }
            }
        });
    }

    return object2Array(def.type.return || children, filter);
}

module.exports = {
    CompletionContext, completionProvider
}
