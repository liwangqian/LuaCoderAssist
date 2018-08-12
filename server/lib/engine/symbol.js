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

const { LinearStack, StackNode } = require('./linear-stack');
const _ = require('underscore');

/**
 * Range concept definition
 * A Range is half open [start(Number), end(Number))
 */
class Range {
    /**
     * 
     * @param {Number} start Start of the range
     * @param {Number} end End of the range
     */
    static new(start, end) {
        return [start, end];
    }
    /**
     * Clone the range
     * @param {[Number, Number]} r Range to clone
     */
    static clone(r) {
        return r && [r[0], r[1]];
    }

    /**
     * Test if @param x includes @param y
     * @param {Range} x The range
     * @param {Range} y The range
     */
    static include(x, y) {
        return x[0] <= y[0] && x[1] >= y[1];
    }

    /**
     * Create a new Range for the location
     * @param {Range} loc The location of the symbol
     * @param {Range} parentScope The parent scope range
     */
    static rangeOf(loc, parentScope) {
        return Range.new(loc[0], parentScope[1]);
    }
}

exports.Range = Range;

const LuaSymbolKind = {
    variable: 'variable',
    parameter: 'parameter',
    property: 'property',
    table: 'table',
    class: 'class',
    module: 'module',
    function: 'function'
}

exports.LuaSymbolKind = LuaSymbolKind;

class LuaSymbol {
    /**
     * Construct a new lua symbol
     * @param {String} name Name of the symbol
     * @param {[Number, Number]} location Location of the symbol
     * @param {[Number, Number]} range Range of the symbol's scope
     * @param {Boolean} isLocal The scope of the symbol
     * @param {String} uri The uri of the Symbol
     * @param {'variable'|'parameter'|'property'|'class'|'module'|'function'} kind The kind name of the symbol
     * @param {LuaFunction|LuaTable|LuaModule|LazyValue} type The type value of the symbol
     */
    constructor(name, location, range, isLocal, uri, kind, type) {
        this.name = name;
        this.location = Range.clone(location);
        this.range = Range.clone(range);
        this.isLocal = isLocal;
        this.uri = uri;
        this.kind = kind;
        this.type = type;
    }

    get(key) {
        return this.type.get && this.type.get(key);
    }

    set(key, value) {
        this.type.set && this.type.set(key, value);
    }
}

LuaSymbol.nil = new LuaSymbol();
exports.LuaSymbol = LuaSymbol;

const LuaTypes = {
    any: 'any',
    number: 'number',
    boolean: 'boolean',
    string: 'string',
    table: 'table',
    function: 'function',
    module: 'module',
    lazy: 'lazy'
}

class LuaTypeBase {
    constructor(typeName) {
        this.typeName = typeName;
    }
}

class LuaNumber extends LuaTypeBase {
    constructor() {
        super(LuaTypes.number);
    }
}

exports.LuaNumber = LuaNumber;

class LuaBoolean extends LuaTypeBase {
    constructor() {
        super(LuaTypes.boolean);
    }
}

exports.LuaBoolean = LuaBoolean;

class LuaString extends LuaTypeBase {
    constructor() {
        super(LuaTypes.string);
    }
}

exports.LuaString = LuaString;

class LuaAny extends LuaTypeBase {
    constructor() {
        super(LuaTypes.any);
    }
}

exports.LuaAny = LuaAny;

const LuaBasicTypes = {
    number: new LuaNumber(),
    boolean: new LuaBoolean(),
    string: new LuaString(),
    any: new LuaAny()
};

exports.LuaBasicTypes = LuaBasicTypes;


class SearchResult {
    /**
     * Search result.
     * @param {LuaSymbol} parent The container symbol
     * @param {String} key The search key
     * @param {LuaSymbol} value The symbol of the key
     */
    constructor(parent, key, value) {
        this.parent = parent;
        this.key = key;
        this.value = value;
    }
}

/* static null result */
SearchResult.null = new SearchResult();
exports.SearchResult = SearchResult;

class LuaTable extends LuaTypeBase {
    constructor(metatable) {
        super(LuaTypes.table);
        this._metatable = metatable;
        this._fields = {};
    }

    set(key, value) {
        if (this._fields[key]) {
            return;
        }

        this._fields[key] = value;
    }

    get(key) {
        return this._fields[key];
    }

    getmetatable() {
        return this._metatable;
    }

    setmetatable(mt) {
        if (mt.type instanceof LuaTable) {
            this._metatable = mt;
        }
    }

    /**
     * Search the scope to get the symbol
     * @param {String} key The symbol name to search
     * @returns {SearchResult} The search result
     */
    search(key) {
        const _search = (table) => {
            if (!table) {
                return SearchResult.null;
            }

            const value = table.get(key);
            if (value) {
                return new SearchResult(table, key, value);
            }

            const mt = table.getmetatable();
            if (!mt || !(mt.type instanceof LuaTable)) {
                return SearchResult.null;
            }

            const __index = mt.type.get('__index');
            if (!__index || !(__index.type instanceof LuaTable)) {
                return SearchResult.null;
            }

            return _search(__index.type);
        }

        return _search(this);
    }
}

exports.LuaTable = LuaTable;

class LuaFunctionEnv {
    constructor() {
        this.globals = new LuaTable();
        this.stack = new LuaTable();
    }
}

class LuaFunction extends LuaTypeBase {
    constructor() {
        super(LuaTypes.function);
        this.args = [];
        this.returns = [];
        this.fenv = new LuaFunctionEnv();
    }

    /**
     * Get the return symbol of the function
     * @param {Number} index Index of the return symbol
     * @returns {LuaSymbol} The symbol of the index
     */
    get(index) {
        return this.returns[index] || LuaSymbol.nil;
    }

    /**
     * Add param to function
     * @param {Number} index Index of the parameter
     * @param {LuaSymbol} symbol The symbol of the param
     */
    param(index, symbol) {
        this.args[index] = symbol;
    }

    /**
     * Add return symbol to function
     * @param {Number} index Index of the return value
     * @param {LuaSymbol} symbol Symbol of the return value
     */
    return(index, symbol) {
        this.returns[index] = symbol;
    }
}

exports.LuaFunction = LuaFunction;

class LuaModuleEnv {
    constructor() {
        this.globals = new LuaTable();
        // this.stack = new LuaTable();
        this.stack = new LinearStack();
    }

    /**
     * Add symbol to module stack
     * @param {LuaSymbol} symbol The symbol
     */
    add(symbol) {
        this.stack.push(symbol);
    }

    search(name, location, filter) {
        const target = new StackNode(new LuaSymbol(name, location));
        const index = _.sortedIndex(this.stack.nodes, target, (node) => {
            return node.data.location[0] - location[0];
        });

        const symbol = this.stack.search((data) => filter(data), index);
        if (symbol) {
            return symbol;
        }

        return this.globals.search(name).value;
    }
}

class LuaModule extends LuaTable {
    constructor(uri) {
        super();
        this.typeName = LuaTypes.module; //override
        this.menv = new LuaModuleEnv();
        this.uri = uri;
        this.return = null;
    }
}

exports.LuaModule = LuaModule;

/**
 * LuaContext for LazyType
 */
class LuaContext {
    /**
     * @param {LuaModule} mdl The lua module type.
     */
    constructor(mdl) {
        this.module = mdl;
        this.stackOffset = mdl.menv.stack.length();
    }

    search(name) {
        let symbol = this.module.menv.stack.search((data) => data.name === name, this.stackOffset);
        if (symbol) return symbol;

        // 查找全局变量
        let result = this.module.search(name);
        if (result) return result.value;

        return null;
    }
}

exports.LuaContext = LuaContext;

class LazyValue {
    /**
     * @param {LuaContext} context Context of the `LazyType`.
     * @param {Object} node AST node provide by luaparse.
     * @param {String} name The name of the symbol of the LazyType.
     * @param {Number} index Value index of right expression.
     */
    constructor(context, node, name, index) {
        this.context = context;
        this.node = node;
        this.name = name;
        this.index = index;
    }
};

exports.LazyValue = LazyValue;

/**
 * @param {LuaContext} context Context of the `LazyType`.
 * @param {Object} node AST node provide by luaparse.
 * @param {String} name The name of the symbol of the LazyType.
 * @param {Number} index Value index of right expression.
 */
function newValue(context, node, name, index) {
    return new LazyValue(context, node, name, index);
}

exports.newValue = newValue;
