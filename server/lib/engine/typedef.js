'use strict';

class LuaSymbol {
    /**
     * 
     * @param {LuaBoolean|LuaFunction|LuaModule|LuaNil|LuaNumber|LuaString|LuaTable|LuaUnknown|LazyType} type type of the symbol
     * @param {String} name name of the symbol
     * @param {Boolean} local is the symbol local
     * @param {Array<Number>} location location of the symbol
     */
    constructor(type, name, local, location) {
        this.type = type;
        this.name = name;
        this.local = local;
        this.location = location;
    }
};

class LuaTypeBase {
    constructor(name) {
        this.name = name;
    }
}

class LuaUnknown extends LuaTypeBase {
    constructor() {
        super('any');
    }
};

class LuaNil extends LuaTypeBase {
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

    search(key) {
        const _search = (table) => {
            if (!table || !(table instanceof LuaTable)) {
                return {};
            }

            const value = table.get(key);
            if (value) {
                return { parent: table, value: value };
            }

            const result = _search(table.__index)
            if (result.value) return result

            const mt = table.getmetatable();
            if (!mt) {
                return {};
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
    constructor(range, parentScope) {
        super('function');
        this.scope = new LuaScope(range, parentScope);
        this.returns = [];
        this.args = [];
    }

    get() {
        return this.returns[0];
    }
};

class LuaModuleEnv extends LuaScope {
    constructor(range, globalEnv) {
        super(range);
        this._G = globalEnv;
    }

    get(name) {
        let def = super.get(name);
        if (def) {
            return def;
        }
        return this._G.type.get(name);
    }

};

class LuaModule extends LuaTypeBase {
    constructor(globalEnv, range, uri) {
        super('module');
        this.scope = new LuaModuleEnv(range, globalEnv);
        this.depends = {};
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

    get(key) {
        return this.exports[key];
    }

    set(key, value) {
        this.exports[key] = value;
    }

    addDepend(name, value) {
        this.depends[name] = value;
    }
};

const BasicTypes = {
    unkown_t: new LuaUnknown(),
    nil_t: new LuaNil(),
    number_t: new LuaNumber(),
    string_t: new LuaString(),
    bool_t: new LuaBoolean(),
}

class LazyType {
    constructor(scope, node, name, index) {
        this.scope = scope;
        this.node = node;
        this.name = name;
        this.index = index;
    }
};

function newType(scope, node, name, index) {
    return new LazyType(scope, node, name, index);
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
    LuaScope,
    LuaFunction,
    LuaModule,
    LazyType,
    newType,
    MultiMap
};
