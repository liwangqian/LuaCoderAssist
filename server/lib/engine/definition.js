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

const { typeOf, findDef } = require('./typeof');
const Is = require('./is');

class DefinitionContext {
    /**
     * Context for query definition of a reference
     * @param {String} expr refernce names, eg. `base.func()` => `base.func`
     * @param {Array<Number>} range refernce range, include the base names
     * @param {String} uri uri of the document where reference exist
     */
    constructor(expr, range, uri) {
        this.names = expr.trim().split(/[\.\:]/);
        this.range = range;
        this.uri = uri;
    }
};


/**
 * Provide the definition of the reference
 * @param {DefinitionContext} context query context
 */
function definitionProvider(context) {
    const names = context.names;
    const length = names.length;
    let def = findDef(names[0], context.uri, context.range);
    if (!def) {
        return [];
    }

    let type = def.type;
    if (Is.lazyValue(type)) {
        type = typeOf(def); //try deduce type
    }

    if (length === 1) {
        return [def];
    }

    if (!Is.luaTable(type) && !Is.luaModule(type)) {
        return [];
    }

    for (let i = 1; i < (length - 1); i++) {
        const name = names[i];
        def = def.type.search(name, context.range).value;
        if (!def) {
            return [];
        }

        let type = typeOf(def);

        // func().abc
        if (Is.luaFunction(type)) {
            def = type.returns[0];
            type = typeOf(def);
        }

        if (Is.luaTable(type)) {
            continue;
        } else {
            return [];
        }
    }

    def = def.type.search(names[length - 1], context.range).value;
    if (def) {
        return [def];
    }

    return [];
}

module.exports = {
    DefinitionContext, definitionProvider
};
