'use strict';

const fs = require('fs')
const luaparse = require('luaparse');
const { LuaSymbol, LuaTable, LuaFunction, LuaModule, LuaScope, BasicTypes } = require('./typedef');
const { newType, typeOf } = require('./typeof');
const { identName, baseName, safeName } = require('./utils');
const LuaEnv = require('./luaenv');

exports.analysis = analysis;
exports.searchSymbol = searchSymbol;

// _G
let _G = LuaEnv.globalEnv();

/** b  
 * Analysis adapt to luaparse
*/
function analysis(code, uri) {
    let moduleType = new LuaModule([0, code.length + 1], _G, uri);
    let theModule = new LuaSymbol(moduleType, null, false, null);
    let currentScope = null;
    let currentFunc = null;

    function isPlaceHolder(name) {
        return name === '_';
    }

    function isInitWithNil(init) {
        return !init || init.name === 'nil';
    }

    function getInitType(init) {
        if (init.type === 'TableConstructorExpression') {
            return parseTableConstructorExpression(init);
        } else {
            return newType(currentScope, init, safeName(init));
        }
    }

    function parseDependence(node, param) {
        if (param.type !== 'StringLiteral') {
            return;
        }

        let mname = param.value.match(/\w+$/)[0];
        let type = newType(currentScope, node);
        let symbol = new LuaSymbol(type, mname, true, node.range, uri);
        currentScope.setSymbol(mname, symbol);
        moduleType.addDepend(mname, symbol);
    }

    function parseLocalStatement(node) {
        node.variables.forEach((variable, index) => {
            let name = variable.name;
            if (isPlaceHolder(name)) {
                return;
            }

            let init = node.init[index];
            if (isInitWithNil(init)) {
                return;
            }

            let type = getInitType(init);
            let symbol = new LuaSymbol(type, name, true, variable.range);

            currentScope.setSymbol(name, symbol);

            walkNode(init);
        });
    }

    function parseAssignmentStatement(node) {
        node.variables.forEach((variable, index) => {
            let name = identName(variable);
            if (!name) {
                walkNode(node.init[index]);
                return;
            }

            if (isPlaceHolder(name)) {
                return;
            }

            let init = node.init[index];
            if (isInitWithNil(init)) {
                return;
            }

            let bName = baseName(variable);
            let { value } = currentScope.searchSymbolUp(bName || name);
            if (value && !bName) {
                return;
            }

            let type = newType(currentScope, init, safeName(init));
            let symbol = new LuaSymbol(type, name, true, variable.range);

            if (bName && value.type instanceof LuaTable) {
                value.type.setField(name, symbol);
            } else {
                currentScope.setSymbol(name, symbol); //TODO: should define in _G ?
            }

            walkNode(init);
        });
    }

    function parseTableConstructorExpression(node) {
        let type = new LuaTable();
        node.fields.forEach((field) => {
            if (field.type !== 'TableKeyString') {
                return;
            }
            let n = field.key.name;
            let t = newType(currentScope, field.value, safeName(field.value));
            let s = new LuaSymbol(t, n, true, field.key.range);
            type.setField(n, s);

            walkNode(field.value);
        });

        return type;
    }

    function parseFunctionDeclaration(node) {
        let name = identName(node.identifier);
        let range = node.range;
        if (name) {
            range = node.identifier.range;
        } else {
            name = '@(' + range + ')';
        }
        let type = new LuaFunction(node.range, currentScope);
        let func = new LuaSymbol(type, name, node.isLocal, range);
        let bName = baseName(node.identifier);
        if (bName) {
            let { value } = currentScope.searchSymbolUp(bName);
            if (value && value.type instanceof LuaTable) {
                value.type.setField(name, func);
            } else {
                //TODO: add definition as global?
            }
        } else {
            currentScope.setSymbol(name, func);
        }

        currentScope = type.scope;

        node.parameters.forEach((param, index) => {
            let name = param.name || param.value;
            let symbol = new LuaSymbol(BasicTypes.unkown_t, name, true, param.range);
            currentScope.setSymbol(name, symbol);
            type.args[index] = name;
        });

        currentFunc = func;
        walkNodes(node.body);
        currentFunc = null;
        currentScope = currentScope.parentScope;
    }

    function parseCallExpression(node) {
        let fname = identName(node.base);
        if (fname === 'module') {
            let mname = (node.argument || node.arguments[0]).value;
            theModule.name = mname;
            moduleType.moduleMode = true;
        } else if (fname === 'require') {
            let param = (node.argument || node.arguments[0]);
            parseDependence(node, param);
        } else if (fname === 'pcall' && node.arguments[0].value === 'require') {
            parseDependence(node, node.arguments[1]);
        }
    }

    function parseDoStatement(node) {
        let scope = new LuaScope(node.range, currentScope);
        currentScope = scope;
        walkNodes(node.body);
        currentScope = scope.parentScope;
    }

    function parseReturnStatement(node) {
        node.arguments.forEach((arg, index) => {
            let t = newType(currentScope, arg, safeName(arg));
            let n = 'R' + index;
            let s = new LuaSymbol(t, n, false, arg.range);
            if (currentFunc) {
                currentFunc.type.returns[index] = s;
            } else {
                theModule.type.exports = s;
            }
        });
    }

    function walkNodes(nodes) {
        nodes.forEach(walkNode);
    }

    function walkNode(node) {
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
            case 'DoStatement':
                parseDoStatement(node);
                break;
            case 'ReturnStatement':
                parseReturnStatement(node);
                break;
            case 'Chunk':
                currentScope = moduleType.scope;
                walkNodes(node.body);
                break;
            default:
                break;
        }
    };

    const node = luaparse.parse(code.toString('utf8'), {
        comments: false,
        scope: true,
        ranges: true
    });

    walkNode(node);

    if (theModule.name == null) {
        theModule.name = theModule.type.fileName;
    }

    return theModule;
}

/**
 * search definition of the symbol
 * @param {{name:string, loc:[number, number]}} symbol the symbol to search.
 */
function searchSymbol(symbol, moduleName) {
    let rootScope = _G;
    let theModule = _G.getSymbol(moduleName);
    if (theModule) {
        rootScope = theModule.type.scope;
    }

    const search = (symbol, scope) => {
        if (!scope || !scope.inScope(symbol.loc)) {
            return null;
        }

        let s = scope.getSymbol(symbol.name);
        if (s) {
            return s;
        }

        for (let i = 0; i < scope.subScopes.length; i++) {
            const _scope = scope.subScopes[i];
            const _symbol = search(symbol, _scope)
            if (_symbol) {
                return _symbol;
            }
        }

        return null;
    }

    return search(symbol, rootScope);
}
