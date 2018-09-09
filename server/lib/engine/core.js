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

const { Scope } = require('./linear-stack');
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
const { typeOf } = require('./typeof');
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
    moduleType.setmetatable(luaenv_1.global__metatable);

    let matchs = uri.match(/(\w+)(\.lua)?$/);
    let rootRange = Range.new(0, Infinity);
    let rootStack = moduleType.menv.stack;
    let currentScope = new Scope(rootStack, rootRange);
    let theModule = new LuaSymbol(matchs[1], Range.new(0, 1), rootRange, false, uri, LuaSymbolKind.module, moduleType);
    theModule.state = { valid: true };
    theModule.children = [];

    let funcStack = [];
    let currentFunc = null;

    function isPlaceHolder(name) {
        return name === '_';
    }

    function parseInitStatement(init, index, name, location, isLocal, done) {
        if (init && init.type === 'TableConstructorExpression') {
            let type = parseTableConstructorExpression(init, name);
            let kind = LuaSymbolKind.table;
            let range = Range.rangeOf(location, currentScope.range);
            let table = new LuaSymbol(name, location, range, isLocal, uri, kind, type);
            table.state = theModule.state;
            done(table);
            return;
        } else if (init && init.type === 'FunctionDeclaration') {
            parseFunctionDeclaration(init, name, location, isLocal, done);
            return;
        } else {
            let type;
            if (init && init.name === name) {
                // local string = string
                type = typeOf(_G.get(name));
            }

            let symbol;
            let range = Range.rangeOf(location, currentScope.range);
            if (init && init.type === 'CallExpression' && init.base.name === 'setmetatable') {
                symbol = parseSetmetatable(init, name, location, range, isLocal);
            } else {
                type = type || (init ? newValue(new LuaContext(moduleType), init, utils_1.safeName(init), index) : LuaBasicTypes.any);
                symbol = new LuaSymbol(name, location, range, isLocal, uri, LuaSymbolKind.variable, type);
            }

            symbol && (symbol.state = theModule.state);
            done(symbol);
            walkNode(init);
            return;
        }
    }

    function parseDependence(node, param) {
        if (param.type !== 'StringLiteral') {
            return;
        }

        let name = param.value.match(/\w+$/)[0];
        let symbol = newValue(new LuaContext(moduleType), node, name, 0);
        moduleType.import(symbol);
    }

    // OK
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
            parseInitStatement(prevInit, idx, name, variable.range, true, symbol => {
                if (!symbol) {
                    return;
                }
                currentScope.push(symbol);
                (currentFunc || theModule).addChild(symbol);
            });
        });
    }

    // OK
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

            // search parent
            const predict = (S) => { return (S.name === name) && (!S.local || S.range[1] <= variable.range[0]) };
            let parent;
            let bName = utils_1.baseNames(variable.base);
            if (bName.length > 0) {
                parent = utils_1.directParent(rootStack, bName);
                if (!parent || !is.luaTable(parent.type)) {
                    return;
                }
            } else {
                parent = rootStack.search(predict);
                if (parent && !is.luaAny(parent.type)) {
                    return;
                }
            }

            let idx = index - prevInitIndex;
            parseInitStatement(init, idx, name, variable.range, false, (symbol) => {
                if (parent) {
                    if (is.luaTable(typeOf(parent))) {
                        parent.set(name, symbol);
                    } else {
                        parent.type = symbol.type;  // local xzy; xzy = 1
                    }
                } else {
                    (currentFunc || theModule).addChild(symbol);
                    if (moduleType.moduleMode) {
                        currentScope.push(symbol);
                        moduleType.set(name, symbol);
                    } else {
                        _G.set(name, symbol);
                        moduleType.menv.globals.set(name, symbol);
                    }
                }
            });
        });
    }

    // OK
    function parseTableConstructorExpression(node) {
        let table = new LuaTable();
        node.fields.forEach((field) => {
            if (field.type !== 'TableKeyString') {
                return;
            }
            let name = field.key.name;
            parseInitStatement(field.value, 0, name, field.key.range, false, symbol => {
                table.set(name, symbol);
            });
        });

        return table;
    }

    // OK
    function parseFunctionDeclaration(node, lvName, lvLocation, lvIsLocal, done) {
        let location, name, isLocal;
        let range = isLocal ? node.range : rootRange;
        if (node.identifier) {
            location = node.identifier.range;
            name = utils_1.identName(node.identifier);
            isLocal = node.isLocal;
        } else {
            location = lvLocation;
            name = lvName;
            isLocal = lvIsLocal;
            range[0] = location[0]; // enlarge to include the location
        }

        let ftype = new LuaFunction();
        let fsymbol = new LuaSymbol(name, location, range, isLocal, uri, LuaSymbolKind.function, ftype);
        fsymbol.state = theModule.state;
        fsymbol.children = [];
        let _self;

        if (done) {
            done(fsymbol);
        } else if (fsymbol.isLocal) {
            /**
             * case: `local function foo() end`
            */
            (currentFunc || theModule).addChild(fsymbol);
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
                        _self = new LuaSymbol('self', parent.location, range, true, parent.uri, parent.kind, parent.type);
                        _self.state = theModule.state;
                    }
                }
            } else {
                (currentFunc || theModule).addChild(fsymbol);
                if (moduleType.moduleMode) {
                    moduleType.set(name, fsymbol);
                } else {
                    _G.set(name, fsymbol);
                    moduleType.menv.globals.set(name, fsymbol);
                }

            }
        }

        currentScope = (new Scope(rootStack, range)).enter(currentScope);

        node.parameters.forEach((param, index) => {
            let name = param.name || param.value;
            let symbol = new LuaSymbol(name, param.range, currentScope.range, true, uri, LuaSymbolKind.parameter, LuaBasicTypes.any);
            symbol.state = theModule.state;
            fsymbol.addChild(symbol);
            currentScope.push(symbol);
            ftype.param(index, symbol);
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
        switch (fname) {
            case 'module':
                let mname = (node.argument || node.arguments[0]).value;
                theModule.name = mname;
                moduleType.moduleMode = true;
                return;
            case 'require':
                let param = (node.argument || node.arguments[0]);
                parseDependence(node, param);
                return;
            case 'pcall':
                if (node.arguments[0].value === 'require') {
                    parseDependence(node, node.arguments[1]);
                }
                return;
            case 'setmetatable':
                parseSetmetatable(node);
                return;
            default:
                break;
        }
    }

    function parseSetmetatable(node, name, location, range, isLocal) {
        const tableNode = node.arguments[0];
        let tableSymbol;
        if (tableNode.type === 'Identifier') {
            tableSymbol = moduleType.search(tableNode.name, tableNode.range).value;
        } else {
            if (tableNode.type === 'TableConstructorExpression') {
                let nodeType = parseTableConstructorExpression(tableNode);
                tableSymbol = new LuaSymbol(name, location, range, isLocal, uri, LuaSymbolKind.table, nodeType);
            }
        }
        if (is.luaTable(typeOf(tableSymbol))) {
            let nodeType;
            let metaNode = node.arguments[1];
            if (metaNode.type === 'TableConstructorExpression') {
                nodeType = parseTableConstructorExpression(metaNode);
            } else {
                nodeType = newValue(new LuaContext(moduleType), node.arguments[1], '__mt');
            }

            let metatable = new LuaSymbol('__mt', null, null, true, uri, LuaSymbolKind.table, nodeType);
            tableSymbol.type.setmetatable(metatable);
        }
        return tableSymbol;
    }

    function parseScopeStatement(node) {
        currentScope = (new Scope(rootStack, node.range)).enter(currentScope);
        walkNodes(node.body);
        currentScope = currentScope.exit([node.range[1], node.range[1]]);
    }

    function parseIfStatement(node) {
        walkNodes(node.clauses);
    }

    function parseReturnStatement(node) {
        node.arguments.forEach((arg, index) => {
            parseInitStatement(arg, 0, 'R' + index, arg.range, false, (symbol) => {
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
        currentScope = (new Scope(rootStack, node.range)).enter(currentScope);

        let variable = node.variable;
        let name = variable.name;
        if (!isPlaceHolder(name)) {
            let symbol = new LuaSymbol(name, variable.range, currentScope.range, true, uri, LuaSymbolKind.variable, LuaBasicTypes.number);
            symbol.state = theModule.state;
            (currentFunc || theModule).addChild(symbol);
            currentScope.push(symbol);
        }

        walkNodes(node.body);
        currentScope = currentScope.exit([node.range[1], node.range[1]]);
    }

    function parseForGenericStatement(node) {
        currentScope = (new Scope(rootStack, node.range)).enter(currentScope);

        let variables = node.variables;
        variables.forEach((variable, index) => {
            let name = variable.name;
            if (!isPlaceHolder(name)) {
                let type = newValue(new LuaContext(moduleType), node.iterators[0], index);
                let symbol = new LuaSymbol(name, variable.range, currentScope.range, true, uri, LuaSymbolKind.variable, type);
                symbol.state = theModule.state;
                (currentFunc || theModule).addChild(symbol);
                currentScope.push(symbol);
            }
        });

        walkNodes(node.body);
        currentScope = currentScope.exit([node.range[1], node.range[1]]);
    }

    function walkNodes(nodes) {
        nodes.forEach(walkNode);
    }

    function walkNode(node, index) {
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

    if (moduleType.moduleMode) {
        _G.set(theModule.name, theModule);
    }

    return theModule;
}

exports.analysis = analysis;
