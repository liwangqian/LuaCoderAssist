'use strict';

const { LinearStack } = require('./linear-stack');

class LuaSymbol {
    /**
     * Construct a lua symbol
     * @param {LuaBoolean|LuaFunction|LuaModule|LuaAny|LuaNumber|LuaString|LuaTable|LazyType} type type of the symbol
     * @param {String} name name of the symbol
     * @param {Boolean} local is the symbol local
     * @param {Number[]} range range of the symbol
     * @param {Object} location location of the symbol
     */
    constructor(type, name, local, range, location) {
        this.type = type;
        this.name = name;
        this.local = local;
        this.range = range;
        this.location = location;
    }
};

class LuaTypeBase {
    constructor(name) {
        this.name = name;
    }
}

class LuaAny extends LuaTypeBase {
    constructor() {
        super('any');
    }
};

class LuaNumber extends LuaTypeBase {
    constructor() {
        super('number');
    }
};

class LuaString extends LuaTypeBase {
    constructor() {
        super('string');
    }
};

class LuaBoolean extends LuaTypeBase {
    constructor() {
        super('boolean');
    }
};

class SearchResult {
    constructor(parent, value) {
        this.parent = parent;
        this.value = value;
    }
}

const NullResult = new SearchResult();

class LuaTable extends LuaTypeBase {
    constructor(_metatable) {
        super('table');
        this.fields = {};
        this.metatable = _metatable;
    }

    set(key, value) {
        if (this.fields[key]) {
            return;
        }
        this.fields[key] = value;  //TODO: 考虑重复赋值不同类型的处理
    }

    get(key) {
        return this.fields[key];
    }

    has(key) {
        return this.fields[key] != null;
    }

    getmetatable() {
        return this.metatable;
    }

    setmetatable(tbl) {
        this.metatable = tbl;
    }

    /**
     * Search the scope to get the symbol
     * @param {String} key The symbol name to search
     * @returns {SearchResult} The search result
     */
    search(key) {
        const _search = (table) => {
            if (!table || !(table instanceof LuaTable)) {
                return NullResult;
            }

            const value = table.get(key);
            if (value) {
                return new SearchResult(table, value);
            }

            const result = _search(table.__index)
            if (result.value) return result

            const mt = table.getmetatable();
            if (!mt) {
                return NullResult;
            }

            return _search(mt.__index);
        }

        return _search(this);
    }
};

class LuaScope {
    constructor(range, parentScope) {
        this.parentScope = parentScope;
        this.subScopes = [];
        this.symbols = {};
        this.range = range;

        if (parentScope) {
            parentScope.subScopes.push(this);
        }
    }

    inScope(range) {
        return this.range[0] <= range[0] && range[1] <= this.range[1];
    }

    has(name) {
        return this.symbols[name] != null;
    }

    get(name) {
        return this.symbols[name];
    }

    set(name, symbol) {
        this.symbols[name] = symbol;
    }

    search(name) {
        const _search = (scope) => {
            if (!scope) {
                return {};
            }

            const value = scope.get(name);
            if (value) {
                return { parent: scope, value: value };
            }

            return _search(scope.parentScope);
        }

        return _search(this);
    }
};

class LuaFunction extends LuaTypeBase {
    constructor() {
        super('function');
        this.returns = [];
        this.args = [];
    }

    get() {
        return this.returns[0];
    }

    return(index, symbol) {
        this.returns[index] = symbol;
    }

    param(index, symbol) {
        this.args[index] = symbol;
    }
};

class LuaModule extends LuaTypeBase {
    constructor(uri) {
        super('module');
        this.stack = new LinearStack();
        this.imports = {};
        this.exports = {};
        this.moduleMode = false;
        this.uri = uri;

        /**
         * in case of fileName != moduleName, so store the fileName is
         * neccesary
         */
        let matchs = uri.match(/(\w+)(\.lua)?$/);
        this.fileName = matchs[1];
    }

    /**
     * Get the symbol with the given name
     * @param {String} name The name of the symbol.
     * @returns {LuaSymbol} The symbol with the same name.
     */
    get(name) {
        return this.exports[name];
    }

    /**
     * Import the symbol to the module.
     * @param {String} name The name of the symbol
     * @param {LuaSymbol} symbol The symbol
     */
    import(symbol) {
        this.imports[symbol.name] = symbol;
    }

    export(symbol) {
        this.exports[symbol.name] = symbol;
    }
};

const BasicTypes = {
    any_t: new LuaAny(),
    number_t: new LuaNumber(),
    string_t: new LuaString(),
    bool_t: new LuaBoolean(),
}

class LuaContext {
    /**
     * @param {LuaModule} mod The lua module type.
     */
    constructor(mod) {
        this.module = mod;
        this.stackOffset = mod.stack.length();
    }

    search(name) {
        let symbol = this.module.stack.search((data) => data.name === name, this.stackOffset);
        if (symbol) return symbol;

        // 查找模块全局变量（导出变量）
        symbol = this.module.exports[name];
        if (symbol) return symbol;

        return null;
    }
}

class LazyType {
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

/**
 * @param {LuaContext} context Context of the `LazyType`.
 * @param {Object} node AST node provide by luaparse.
 * @param {String} name The name of the symbol of the LazyType.
 * @param {Number} index Value index of right expression.
 */
function newType(context, node, name, index) {
    return new LazyType(context, node, name, index);
}

class MultiMap {
    constructor() {
        this._map = new Map();
    }

    get(key) {
        return this._map.get(key);
    }

    set(key, val) {
        let values = this._map.get(key) || new Set();
        values.add(val);
        this._map.set(key, values);
    }

    has(key) {
        return this._map.has(key)
    }
};

module.exports = {
    LuaSymbol,
    BasicTypes,
    LuaTable,
    LuaFunction,
    LuaModule,
    LuaContext,
    LazyType,
    newType,
    MultiMap
};
