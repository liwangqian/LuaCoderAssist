'use strict';

const luaparse = require('luaparse');
const { LuaSymbol, LuaTable, LuaFunction, LuaModule, BasicTypes, newType, LuaContext } = require('./typedef');
const { typeOf } = require('./typeof');
const { Scope } = require('./linear-stack');
const { identName, baseName, baseNames, safeName, directParent } = require('./utils');
const Is = require('./is');
const LuaEnv = require('./luaenv');

exports.analysis = analysis;

// _G
let _G = LuaEnv._G;

function analysis(code, uri) {
    let moduleType = new LuaModule(uri);
    let theModule = new LuaSymbol(moduleType, null, false, null);
    let currentScope = new Scope(moduleType.stack);
    let stack = moduleType.stack;
    let funcStack = [];
    let currentFunc = null;

    function isPlaceHolder(name) {
        return name === '_';
    }

    function getInitType(init, index) {
        if (!init) return BasicTypes.any_t;
        if (init.type === 'TableConstructorExpression') {
            return parseTableConstructorExpression(init);
        } else {
            return newType(new LuaContext(moduleType), init, safeName(init), index);
        }
    }

    function parseDependence(node, param) {
        if (param.type !== 'StringLiteral') {
            return;
        }

        let name = param.value.match(/\w+$/)[0];
        let symbol = newType(new LuaContext(moduleType), node, name);
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
            let type = getInitType(prevInit, idx);
            let symbol = new LuaSymbol(type, name, true, variable.range);
            currentScope.push(symbol);

            init && walkNode(init);
        });
    }

    function parseAssignmentStatement(node) {
        let prevInit = node.init[0];
        let prevInitIndex = 0;
        node.variables.forEach((variable, index) => {
            let init = node.init[index];
            let name = identName(variable);
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

            const predict = (S) => { return (S.name === name) && (!S.local || S.location[1] <= variable.range[0]) };
            let value;
            let bName = baseNames(variable.base);
            if (bName.length > 0) {
                value = directParent(stack, bName);
                if (!value || !Is.luatable(value.type)) {
                    return;
                }
            } else {
                value = stack.search(predict);
                if (value && !Is.luaany(value.type)) {
                    return;
                }
            }

            let idx = index - prevInitIndex;
            let type = getInitType(init, idx);
            let symbol = new LuaSymbol(type, name, false, variable.range);

            if (value) {
                if (Is.luatable(typeOf(value))) {
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
            let type = getInitType(field.value);
            let symbol = new LuaSymbol(type, name, true, field.key.range);
            table.set(name, symbol);

            walkNode(field.value);
        });

        return table;
    }

    function parseFunctionDeclaration(node) {
        let name = identName(node.identifier);
        let range = node.range;
        if (name) {
            range = node.identifier.range;
        } else {
            name = '@(' + range + ')';
        }

        let type = new LuaFunction();
        let func = new LuaSymbol(type, name, node.isLocal, range);
        let _self;

        if (func.local) {
            /**
             * case: `local function foo() end`
            */
            currentScope.push(func);
        } else {

            /**
             * case 1: `function foo() end`
             * case 2: `function class.foo() end` or `function class:foo() end`
             * case 3: `function module.class:foo() end`
             * ...
             */
            let bName = baseNames(node.identifier.base);
            if (bName.length > 0) {
                let parent = directParent(stack, bName);
                if (parent && Is.luatable(parent.type)) {
                    parent.type.set(name, func);
                    if (node.identifier.indexer === ':') {
                        _self = new LuaSymbol(parent.type, 'self', true, range);
                    }
                }
            } else {
                currentScope.push(func); /* for search at hand */
                moduleType.export(func);
            }
        }

        currentScope = (new Scope(stack)).enter(currentScope);

        node.parameters.forEach((param, index) => {
            let name = param.name || param.value;
            let symbol = new LuaSymbol(BasicTypes.any_t, name, true, param.range);
            currentScope.push(symbol);
            type.param(index, symbol);
        });

        /* self is defined after the params */
        _self && currentScope.push(_self);

        funcStack.push(currentFunc);
        currentFunc = func;
        walkNodes(node.body);
        currentFunc = funcStack.pop();

        currentScope = currentScope.exit([node.range[1], node.range[1]]);
    }

    function parseCallExpression(node) {
        let fname = identName(node.base);
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
        currentScope = (new Scope(stack)).enter(currentScope);
        walkNodes(node.body);
        currentScope = currentScope.exit();
    }

    function parseIfStatement(node) {
        walkNodes(node.clauses);
    }

    function parseReturnStatement(node) {
        node.arguments.forEach((arg, index) => {
            let type = getInitType(arg, index);
            let name = 'R' + index;
            let symbol = new LuaSymbol(type, name, false, arg.range);
            if (currentFunc) {
                // return from function
                currentFunc.type.return(index, symbol);
            } else {
                // return from module
                moduleType.exports = symbol;
            }

            walkNode(arg);
        });
    }

    function parseForNumericStatement(node) {
        currentScope = (new Scope(stack)).enter(currentScope);

        let variable = node.variable;
        let name = variable.name;
        if (!isPlaceHolder(name)) {
            let symbol = new LuaSymbol(BasicTypes.number_t, name, true, variable.range);
            currentScope.push(symbol);
        }

        walkNodes(node.body);
        currentScope = currentScope.exit();
    }

    function parseForGenericStatement(node) {
        currentScope = (new Scope(stack)).enter(currentScope);

        let variables = node.variables;
        variables.forEach((variable, index) => {
            let name = variable.name;
            if (!isPlaceHolder(name)) {
                let type = newType(new LuaContext(moduleType), node.iterators[0], index);
                let symbol = new LuaSymbol(type, name, true, variable.range);
                currentScope.push(symbol);
            }
        });

        walkNodes(node.body);
        currentScope = currentScope.exit();
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
