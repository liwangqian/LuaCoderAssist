'use strict';

const { Scope, ScopeEnd } = require('./linear-stack');
const {
    LuaSymbolKind,
    LuaSymbol,
    LuaFunction,
    LuaTable,
    LuaModule,
    LuaContext,
    newValue,
    Range,
    LuaBasicTypes
} = require('./symbol');
const is = require('./is');
const utils_1 = require('./utils');
const luaenv_1 = require('./luaenv');
const luaparse_1 = require('luaparse');

// _G
let _G = luaenv_1._G;

/**
 * Analysis the document
 * @param {String} code Code content of the document
 * @param {String} uri The uri of the document
 */
function analysis(code, uri) {
    let moduleType = new LuaModule(uri);
    moduleType.menv.globals.setmetatable(luaenv_1.global__metatable);
    let matchs = uri.match(/(\w+)(\.lua)?$/);
    let rootRange = Range.new(0, Infinity);
    let rootStack = moduleType.menv.stack;
    let currentScope = new Scope(rootStack, rootRange);
    let theModule = new LuaSymbol(matchs[1], Range.new(0, 1), rootRange, false, uri, LuaSymbolKind.module, moduleType);
    let funcStack = [];
    let currentFunc = null;

    function isPlaceHolder(name) {
        return name === '_';
    }

    function parseInitStatement(init, index, name, location, isLocal, done) {
        if (!init) return;
        if (init.type === 'TableConstructorExpression') {
            let type = parseTableConstructorExpression(init);
            let kind = LuaSymbolKind.table;
            let range = Range.rangeOf(location, currentScope.range);
            let table = new LuaSymbol(name, location, range, isLocal, uri, kind, type);
            done(table);
            return;
        } else if (init.type === 'FunctionDeclaration') {
            parseFunctionDeclaration(init, name, location, isLocal, done);
            return;
        } else {
            let type = newValue(new LuaContext(moduleType), init, utils_1.safeName(init), index);
            let range = Range.rangeOf(location, currentScope.range);
            let lazy = new LuaSymbol(name, location, range, isLocal, uri, LuaSymbolKind.variable, type);
            done(lazy);
            walkNode(init);
            return;
        }
    }

    function parseDependence(node, param) {
        if (param.type !== 'StringLiteral') {
            return;
        }

        let name = param.value.match(/\w+$/)[0];
        let symbol = newValue(new LuaContext(moduleType), node, name);
        moduleType.import(symbol);
    }

    function parseLocalStatement(node) {
        let prevInit = node.init[0];
        let prevInitIndex = 0;
        node.variables.forEach((variable, index) => {
            let name = variable.name;
            if (isPlaceHolder(name)) {
                return;
            }

            let init = node.init[index];
            prevInit = init || prevInit;
            if (init) {
                prevInitIndex = index;
            }
            let idx = index - prevInitIndex; // in case: local x, y, z = true, abc()
            parseInitStatement(prevInit, idx, name, variable.range, true, symbol => currentScope.push(symbol));
        });
    }

    function parseAssignmentStatement(node) {
        let prevInit = node.init[0];
        let prevInitIndex = 0;
        node.variables.forEach((variable, index) => {
            let init = node.init[index];
            let name = utils_1.identName(variable);
            if (!name) {
                walkNode(init);
                return;
            }

            if (isPlaceHolder(name)) {
                return;
            }

            // in case: x, y, z = true, abc()
            prevInit = init || prevInit;
            if (init) {
                prevInitIndex = index;
            }

            const predict = (S) => { return (S.name === name) && (!S.local || S.range[1] <= variable.range[0]) };
            let value;
            let bName = baseNames(variable.base);
            if (bName.length > 0) {
                value = directParent(rootStack, bName);
                if (!value || !is.luatable(value.type)) {
                    return;
                }
            } else {
                value = rootStack.search(predict);
                if (value && !is.luaany(value.type)) {
                    return;
                }
            }

            let idx = index - prevInitIndex;
            let type = parseInitStatement(init, idx);
            let symbol = new LuaSymbol(type, name, false, variable.range, variable.loc);

            if (value) {
                if (is.luatable(typeOf(value))) {
                    value.type.set(name, symbol);
                } else {
                    value.type = type;  // local xzy; xzy = 1
                }
            } else {
                currentScope.push(symbol); // cached
                if (moduleType.moduleMode) {
                    moduleType.export(symbol);
                } else {
                    _G.type.set(name, symbol);
                }
            }

            walkNode(init);
        });
    }

    function parseTableConstructorExpression(node) {
        let table = new LuaTable();
        node.fields.forEach((field) => {
            if (field.type !== 'TableKeyString') {
                return;
            }
            let name = field.key.name;
            parseInitStatement(field.value, 0, name, field.key.range, false, symbol => table.set(name, symbol));
            walkNode(field.value);
        });

        return table;
    }

    function parseFunctionDeclaration(node, lvName, lvLocation, lvIsLocal) {
        let range = node.range;
        let location, name, isLocal;
        if (node.identifier) {
            location = node.identifier.range;
            name = utils_1.identName(node.identifier);
            isLocal = node.isLocal;
        } else {
            location = lvLocation;
            name = lvName;
            isLocal = lvIsLocal;
        }

        let type = new LuaFunction();
        let fsymbol = new LuaSymbol(name, location, range, isLocal, uri, LuaSymbolKind.function, type);
        let _self;

        if (fsymbol.isLocal) {
            /**
             * case: `local function foo() end`
            */
            currentScope.push(fsymbol);
        } else {

            /**
             * case 1: `function foo() end`  
             * case 2: `function class.foo() end` or `function class:foo() end`  
             * case 3: `function module.class:foo() end`  
             * ...
             */
            let baseNames = utils_1.baseNames(node.identifier && node.identifier.base);
            if (baseNames.length > 0) {
                let parent = utils_1.directParent(rootStack, baseNames);
                if (parent && is.luaTable(parent.type)) {
                    parent.kind = LuaSymbolKind.class;
                    parent.set(name, fsymbol);
                    if (node.identifier.indexer === ':') {
                        _self = new LuaSymbol('self', parent.location, range, true, parent.kind, parent.type);
                    }
                }
            } else {
                currentScope.push(fsymbol); /* for search at hand */
                moduleType.set(name, fsymbol);
            }
        }

        currentScope = (new Scope(rootStack, range)).enter(currentScope);

        node.parameters.forEach((param, index) => {
            let name = param.name || param.value;
            let symbol = new LuaSymbol(name, param.range, currentScope.range, true, uri, LuaSymbolKind.parameter, LuaBasicTypes.any);
            currentScope.push(symbol);
            type.param(index, symbol);
        });

        /* self is defined after the params */
        _self && currentScope.push(_self);

        funcStack.push(currentFunc);
        currentFunc = fsymbol;
        walkNodes(node.body);
        currentFunc = funcStack.pop();

        currentScope = currentScope.exit([node.range[1], node.range[1]]);
    }

    function parseCallExpression(node) {
        let fname = utils_1.identName(node.base);
        if (fname === 'module') {
            let mname = (node.argument || node.arguments[0]).value;
            theModule.name = mname;
            moduleType.moduleMode = true;
        }

        if (moduleType.moduleMode) {
            if (fname === 'require') {
                let param = (node.argument || node.arguments[0]);
                parseDependence(node, param);
            } else if (fname === 'pcall' && node.arguments[0].value === 'require') {
                parseDependence(node, node.arguments[1]);
            } else {
                //empty
            }
        }
    }

    function parseScopeStatement(node) {
        currentScope = (new Scope(rootStack)).enter(currentScope);
        walkNodes(node.body);
        currentScope = currentScope.exit([node.range[1], node.range[1]]);
    }

    function parseIfStatement(node) {
        walkNodes(node.clauses);
    }

    function parseReturnStatement(node) {
        node.arguments.forEach((arg, index) => {
            parseInitStatement(arg, index, 'R' + index, arg.range, false, (symbol) => {
                if (currentFunc) {
                    // return from function
                    currentFunc.type.return(index, symbol);
                } else {
                    // return from module
                    moduleType.return = symbol;
                }
            });
        });
    }

    function parseForNumericStatement(node) {
        currentScope = (new Scope(rootStack)).enter(currentScope);

        let variable = node.variable;
        let name = variable.name;
        if (!isPlaceHolder(name)) {
            let symbol = new LuaSymbol(BasicTypes.number_t, name, true, variable.range, variable.loc);
            currentScope.push(symbol);
        }

        walkNodes(node.body);
        currentScope = currentScope.exit([node.range[1], node.range[1]]);
    }

    function parseForGenericStatement(node) {
        currentScope = (new Scope(rootStack)).enter(currentScope);

        let variables = node.variables;
        variables.forEach((variable, index) => {
            let name = variable.name;
            if (!isPlaceHolder(name)) {
                let type = newValue(new LuaContext(moduleType), node.iterators[0], index);
                let symbol = new LuaSymbol(type, name, true, variable.range, variable.loc);
                currentScope.push(symbol);
            }
        });

        walkNodes(node.body);
        currentScope = currentScope.exit([node.range[1], node.range[1]]);
    }

    function walkNodes(nodes) {
        nodes.forEach(walkNode);
    }

    function walkNode(node) {
        if (!node) return;
        switch (node.type) {
            case 'AssignmentStatement':
                parseAssignmentStatement(node);
                break;
            case 'LocalStatement':
                parseLocalStatement(node);
                break;
            case 'FunctionDeclaration':
                parseFunctionDeclaration(node);
                break;
            case 'CallStatement':
                walkNode(node.expression);
                break;
            case 'CallExpression':  //in module mode(Lua_5.1)
            case 'StringCallExpression':
                parseCallExpression(node);
                break;
            case 'IfClause':
            case 'ElseifClause':
            case 'ElseClause':
            case 'WhileStatement':
            case 'RepeatStatement':
            case 'DoStatement':
                parseScopeStatement(node);
                break;
            case 'ForNumericStatement':
                parseForNumericStatement(node);
                break;
            case 'ForGenericStatement':
                parseForGenericStatement(node);
                break;
            case 'ReturnStatement':
                parseReturnStatement(node);
                break;
            case 'IfStatement':
                parseIfStatement(node);
                break;
            case 'Chunk':
                walkNodes(node.body);
                break;
            default:
                break;
        }
    };

    const node = luaparse_1.parse(code.toString('utf8'), {
        comments: false,
        scope: true,
        ranges: true,
    });

    walkNode(node);

    if (theModule.name == null) {
        theModule.name = theModule.kind.fileName;
    }

    return theModule;
}

exports.analysis = analysis;
