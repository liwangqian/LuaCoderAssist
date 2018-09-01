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

const is = require('./is');

function identName(ident) {
    if (ident) {
        return ident.name || identName(ident.identifier);
    } else {
        return null;
    }
}

function baseName(ident) {
    if (!ident) {
        return null;
    }
    if (ident.base) {
        return baseName(ident.base);
    } else {
        return ident.name;
    }
}

function baseNames(node) {
    let names = [];
    const _iter = (base) => {
        if (!base) {
            return;
        }

        if (base.base) {
            _iter(base.base);
        }

        names.push(identName(base));
    }

    _iter(node);
    return names;
}

function safeName(node) {
    return node.name || '@(' + node.range + ')';
}

function object2Array(obj, filterout) {
    let array = [];
    filterout = filterout || (() => false);
    for (const key in obj) {
        const e = obj[key];
        if (!filterout(e)) {
            array.push(e);
        }
    }
    return array;
}

function directParent(stack, names) {
    let parent = stack.search((data) => data.name === names[0]);
    for (let i = 1; i < names.length; i++) {
        if (parent && is.luaTable(parent.type)) {
            const result = parent.type.search(names[i]);
            parent = result.value;
            continue;
        } else {
            parent = null;
            break;
        }
    }
    return parent;
}

module.exports = {
    identName,
    baseName,
    baseNames,
    safeName,
    directParent,
    object2Array
};
