'use strict';

class LuaSymbol {
    constructor(type, name, local, location) {
        this.type = type;
        this.name = name;
        this.local = local;
        this.location = location;
    }
};

class LuaTypeBase {
    constructor(typeName) {
        this.typeName = typeName;
    }
}

class LuaUnknown extends LuaTypeBase {
    constructor() {
        super('unknown');
    }
};

class LuaNil extends LuaTypeBase {
    constructor() {
        super('nil');
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
        this.fields = new Map();
        this.metatable = _metatable;
    }

    setField(key, value) {
        if (this.fields.has(key)) {
            return;
        }
        this.fields.set(key, value);  //TODO: 考虑重复赋值不同类型的处理
    }

    getField(key) {
        return this.fields.get(key);
    }

    hasField(key) {
        return this.fields.has(key);
    }

    getMetatable() {
        return this.metatable;
    }

    setMetatable(tbl) {
        this.metatable = tbl;
    }

    /**
     * Search key alone the inherit link-list
     * @param {string} key the field name
     * @returns \{} if not found, \{table, value} if found, and table.getField(key) == value
     */
    searchField(key) {
        const search = (table) => {
            if (!table) {
                return {};
            }

            const value = table.getField(key);
            if (value) {
                return { table, value };
            }

            const mt = table.getMetatable();
            if (!mt) {
                return {};
            }

            return search(mt.__index);
        }

        return search(this);
    }
};

class LuaScope {
    constructor(range, parentScope) {
        this.parentScope = parentScope;
        this.subScopes = [];
        this.symbols = new Map();
        this.range = range;

        if (parentScope) {
            parentScope.subScopes.push(this);
        }
    }

    inScope(range) {
        return this.range[0] <= range[0] && range[1] <= this.range[1];
    }

    hasSymbol(name) {
        return this.symbols.has(name);
    }

    getSymbol(name) {
        return this.symbols.get(name);
    }

    setSymbol(name, symbol) {
        this.symbols.set(name, symbol);
    }

    searchSymbolUp(name) {
        const search = (scope) => {
            if (!scope) {
                return {};
            }

            const value = scope.getSymbol(name);
            if (value) {
                return { scope, value };
            }

            return search(scope.parentScope);
        }

        return search(this);
    }
};

class LuaFunction extends LuaTypeBase {
    constructor(range, parentScope) {
        super('function');
        this.scope = new LuaScope(range, parentScope);
        this.returns = [];
        this.args = [];
    }
};

class LuaModule extends LuaTypeBase {
    constructor(range, parentScope, uri) {
        super('module');
        this.scope = new LuaScope(range, parentScope);
        this.depends = new Map();
        this.exports = new Map();
        this.moduleMode = false;
        this.uri = uri;

        /**
         * in case of fileName != moduleName, so store the fileName is
         * neccesary
         */
        let matchs = uri.match(/(\w+)(\.lua)?$/);
        this.fileName = matchs[1];
    }

    addDepend(name, value) {
        this.depends.set(name, value);
    }
};

const BasicTypes = {
    unkown_t: new LuaUnknown(),
    nil_t: new LuaNil(),
    number_t: new LuaNumber(),
    string_t: new LuaString(),
    bool_t: new LuaBoolean(),
}

module.exports = {
    LuaSymbol,
    BasicTypes,
    LuaTable,
    LuaScope,
    LuaFunction,
    LuaModule
};
