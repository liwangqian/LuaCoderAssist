'use strict';

const luaparse = require('luaparse');
const { LuaSymbol, LuaTable, LuaFunction, LuaModule, LuaScope, BasicTypes, newType } = require('./typedef');
const { identName, baseName, safeName } = require('./utils');
const LuaEnv = require('./luaenv');

exports.analysis = analysis;

// _G
let _G = LuaEnv._G;

function analysis(code, uri) {
    let moduleType = new LuaModule(_G, [0, code.length + 1], uri);
    let theModule = new LuaSymbol(moduleType, null, false, null);
    let currentScope = null;
    let currentFunc = null;
    let lastFunc = null;

    function isPlaceHolder(name) {
        return name === '_';
    }

    function isInitWithNil(init) {
        return !init || init.name === 'nil';
    }

    function getInitType(init, index) {
        if (init.type === 'TableConstructorExpression') {
            return parseTableConstructorExpression(init);
        } else {
            return newType(currentScope, init, safeName(init), index);
        }
    }

    function parseDependence(node, param) {
        if (param.type !== 'StringLiteral') {
            return;
        }

        let mname = param.value.match(/\w+$/)[0];
        let type = newType(currentScope, node);
        let symbol = new LuaSymbol(type, mname, true, node.range, uri);
        currentScope.set(mname, symbol);
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

            let type = getInitType(init, index);
            let symbol = new LuaSymbol(type, name, true, variable.range);

            currentScope.set(name, symbol);

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
            let { value } = currentScope.search(bName || name);
            if (value && !bName) {
                return;
            }

            let type = getInitType(init, index);
            let symbol = new LuaSymbol(type, name, false, variable.range);

            if (value && value.type instanceof LuaTable) {
                value.type.set(name, symbol);
            } else {
                currentScope.set(name, symbol); //TODO: should define in _G ?
                if (moduleType.moduleMode) {
                    moduleType.exports[name] = symbol;
                } else {
                    _G.type.set(name, symbol);
                }
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
            let t = getInitType(field.value);
            let s = new LuaSymbol(t, n, true, field.key.range);
            type.set(n, s);

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
            let { value } = currentScope.search(bName);
            if (value && value.type instanceof LuaTable) {
                value.type.set(name, func);
            } else {
                //TODO: add definition as global?
            }
        } else {
            currentScope.set(name, func);
        }

        currentScope = type.scope;

        node.parameters.forEach((param, index) => {
            let name = param.name || param.value;
            let symbol = new LuaSymbol(BasicTypes.unkown_t, name, true, param.range);
            currentScope.set(name, symbol);
            type.args[index] = name;
        });

        lastFunc = currentFunc;
        currentFunc = func;
        walkNodes(node.body);
        currentFunc = lastFunc;
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

    function parseScopeStatement(node) {
        let scope = new LuaScope(node.range, currentScope);
        currentScope = scope;
        walkNodes(node.body);
        currentScope = scope.parentScope;
    }

    function parseIfStatement(node) {
        walkNodes(node.clauses);
    }

    function parseReturnStatement(node) {
        node.arguments.forEach((arg, index) => {
            let t = newType(currentScope, arg, safeName(arg));
            let n = 'R' + index;
            let s = new LuaSymbol(t, n, false, arg.range);
            if (currentFunc) {
                // return from function
                currentFunc.type.returns[index] = s;
            } else {
                // return from module
                theModule.type.exports = s;
            }
        });
    }

    function parseForNumericStatement(node) {
        let scope = new LuaScope(node.range, currentScope);
        currentScope = scope;

        let variable = node.variable;
        let name = variable.name;
        if (!isPlaceHolder(name)) {
            let symbol = new LuaSymbol(BasicTypes.number_t, name, true, variable.range);
            scope.set(name, symbol);
        }

        walkNodes(node.body);
        currentScope = scope.parentScope;
    }

    function parseForGenericStatement(node) {
        let scope = new LuaScope(node.range, currentScope);
        currentScope = scope;

        let variables = node.variables;
        variables.forEach((variable, index) => {
            let name = variable.name;
            if (!isPlaceHolder(name)) {
                let symbol = new LuaSymbol(newType(scope, node.iterators[0], index), name, true, variable.range);
                scope.set(name, symbol);
            }
        });

        walkNodes(node.body);
        currentScope = scope.parentScope;
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
            case 'ifClause':
            case 'ElseifClause':
            case 'elseClause':
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
