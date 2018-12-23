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
 * Deduce the type of symbol
 * Define this function to resolve the dependence loop between symbol.js and typeof.js
 * @param {LuaSymbol} symbol 
 */
function typeOf(symbol) {
    const _typeOf = require('./typeof');
    return _typeOf.typeOf(symbol);
}

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
    function: 'function',
    thread: 'thread',
    userdata: 'userdata'
}

exports.LuaSymbolKind = LuaSymbolKind;

class LuaSymbol {
    /**
     * Construct a new lua symbol
     * @param {String} name Name of the symbol
     * @param {[Number, Number]} location Location of the symbol
     * @param {[Number, Number]} range Range of the symbol's definition
     * @param {[Number, Number]} scope Scope of the symbol
     * @param {Boolean} isLocal The scope of the symbol
     * @param {String} uri The uri of the Symbol
     * @param {'variable'|'parameter'|'property'|'class'|'module'|'function'} kind The kind name of the symbol
     * @param {LuaFunction|LuaTable|LuaModule|LazyValue} type The type value of the symbol
     */
    constructor(name, location, range, scope, isLocal, uri, kind, type) {
        this.name = name;
        this.location = Range.clone(location);
        this.range = Range.clone(range);
        this.scope = Range.clone(scope);
        this.isLocal = isLocal;
        this.uri = uri;
        this.kind = kind;
        this.type = type;
        this.state = undefined; //refer to module's state
        this.children = undefined;

        /*add for extend 3rd libraries in json format*/
        this.displayName = undefined;
        this.description = undefined;
        this.link = undefined;
    }

    get(key) {
        return this.type.get(key);
    }

    set(key, value, force = false) {
        this.type.set(key, value, force);
    }

    get valid() {
        return this.state.valid;
    }

    invalidate() {
        this.state.valid = false;
    }

    addChild(child) {
        this.children.push(child);
    }
}

LuaSymbol.nil = new LuaSymbol();
LuaSymbol.nil.state = { valid: false };
exports.LuaSymbol = LuaSymbol;

const LuaTypes = {
    any: 'any',
    number: 'number',
    boolean: 'boolean',
    string: 'string',
    table: 'table',
    function: 'function',
    module: 'module',
    thread: 'thread',
    userdata: 'userdata',
    lazy: 'lazy'
}

class LuaTypeBase {
    constructor(typeName) {
        this.typeName = typeName;
        this.description = undefined;
        this.link = undefined;
        this.insertSnippet = undefined;
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

class LuaThread extends LuaTypeBase {
    constructor() {
        super(LuaTypes.thread);
    }
}

exports.LuaThread = LuaThread;

class LuaUserData extends LuaTypeBase {
    constructor() {
        super(LuaTypes.userdata);
    }
}

exports.LuaUserData = LuaUserData;

class LuaAny extends LuaTypeBase {
    constructor() {
        super(LuaTypes.any);
    }
}

class LuaNameType extends LuaTypeBase {
    constructor(typeName) {
        super(typeName);
    }
}

exports.LuaNameType = LuaNameType;

exports.LuaAny = LuaAny;

const LuaBasicTypes = {
    number: new LuaNumber(),
    boolean: new LuaBoolean(),
    string: new LuaString(),
    thread: new LuaThread(),
    userdata: new LuaUserData(),
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

class TypeGroup {
    constructor() {
        this.symbols = [];
    }

    has(predictor) {
        return this.indexOf(predictor) < this.symbols.length;
    }

    indexOf(predictor) {
        const length = this.symbol.length;
        for (let i = 0; i < length; i++) {
            const symbol = this.symbols[i];
            if (predictor(symbol)) {
                return i;
            }
        }
        return length;
    }

    add(symbol) {
        const index = this.indexOf(s => s.uri === symbol.uri);
        delete this.symbols[index];
        this.symbols[index] = symbol;
        return index;
    }

    del(symbol) {
        const index = this.indexOf(s => s.uri === symbol.uri);
        delete this.symbols.splice(index, 1)[0];
    }

    get(name, modulePath) {
        const symbols = [];
        this.symbols.forEach(symbol => {
            if (!symbol.uri || symbol.uri.includes(modulePath)) {
                if (symbol.type instanceof LuaTable) {
                    let field = symbol.get(name);
                    field && symbols.push(field);
                }
            }
        });
        return symbols;
    }
}

exports.TypeGroup = TypeGroup;

class LuaTable extends LuaTypeBase {
    constructor(metatable) {
        super(LuaTypes.table);
        this._metatable = metatable;
        this._fields = {};
    }

    set(key, value, force = false) {
        const ov = this._fields[key];
        if (!force && ov && ov.valid) {
            return;
        }

        this._fields[key] = value;
    }

    get(key) {
        return this._fields[key];
    }

    get fields() {
        return this._fields;
    }

    getmetatable() {
        return this._metatable;
    }

    setmetatable(mt) {
        this._metatable = mt;
    }

    /**
     * Search the scope to get the symbol
     * @param {String} key The symbol name to search
     * @returns {SearchResult} The search result
     */
    search(key) {
        const _search = (table) => {
            const value = table.get(key);
            if (value) {
                return new SearchResult(table, key, value);
            }

            const metatable = table.getmetatable();
            if (!metatable || !(typeOf(metatable) instanceof LuaTable)) {
                return SearchResult.null;
            }

            const __index = metatable.get('__index');
            if (!__index || !(typeOf(__index) instanceof LuaTable)) {
                return SearchResult.null;
            }

            return _search(__index.type);
        }

        return _search(this);
    }

    walk(solver) {
        solver(this._fields);
        const metatable = this.getmetatable();
        if (!metatable || !(typeOf(metatable) instanceof LuaTable)) {
            return;
        }

        const __index = metatable.get('__index');
        if (!__index || !(typeOf(__index) instanceof LuaTable)) {
            return;
        }

        __index.type.walk(solver);
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

        /*support for override functions with different params*/
        this.variants = undefined;
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

    /**
     * Search a symbol in the module.
     * @param {String} name The symbol name
     * @param {Number[]} location The location of the symbol refer
     * @param {Function} filter The filter function
     * @return {LuaSymbol} The symbol
     */
    search(name, location, filter) {
        const target = new StackNode(new LuaSymbol(name, location));
        const index = _.sortedIndex(this.stack.nodes, target, (node) => {
            return node.data.location[0] - location[0];
        });

        let indexNode = this.stack.nodes[index];
        if (indexNode && indexNode.data.name === name) { // Hover the definition
            return indexNode.data;
        }

        return this.stack.search(filter, index) || this.globals.get(name);
    }
}

class LuaModule extends LuaTable {
    constructor(uri) {
        super();
        this.typeName = LuaTypes.module; //override
        this.menv = new LuaModuleEnv();
        this.uri = uri;
        this.imports = [];
        this.return = null;
        this.moduleMode = false;
        this.state = { valid: true };
    }

    import(moduleName) {
        this.imports.push(moduleName);
    }

    search(name, location, filter) {
        if (location) {
            filter = filter || (symbol => symbol.name === name);
            let symbol = this.menv.search(name, location, filter);
            if (symbol) {
                return new SearchResult(null, name, symbol);
            }
        }

        return super.search(name);
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

    search(name, location, filter) {
        let symbol = this.module.menv.stack.search((data) => data.name === name, this.stackOffset);
        if (symbol) return symbol;

        // 查找全局变量
        let result = this.module.search(name, location, filter);
        return result.value;
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
function lazyType(context, node, name, index) {
    return new LazyValue(context, node, name, index);
}

exports.lazyType = lazyType;
