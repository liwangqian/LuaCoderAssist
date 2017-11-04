'use strict';

const traits = require('../symbol-traits');
const utils  = require('../utils');

exports.parse = (walker, node, container, scope, parentSymbol, isDef) => {
    for (let i = 0; i < node.variables.length; i++) {
        let variable = node.variables[i];
        let newSymbol = traits.symbol(utils.safeName(variable), traits.SymbolKind.variable, true);
        newSymbol.scope     = scope;
        newSymbol.container = container;
        newSymbol.location  = utils.loc2Range(variable.loc);

        walker.addDef(newSymbol);

        if (node.init && node.init[i]) {
            let init = node.init[i];
            if (init.type == 'TableConstructorExpression') {
                newSymbol.kind = traits.SymbolKind.class;
                walker.walkNodes(init.fields, container, scope, newSymbol, true);
            } else if (init.type == 'FunctionDeclaration') {
                newSymbol.kind = traits.SymbolKind.function;
                newSymbol.params = init.parameters.map(p => { return p.name; });
                walker.walkNodes(init, container, scope, newSymbol, true);
            } else {
                newSymbol.alias = init.name; //这里只处理local x = y的场景，alias=y
                walker.walkNode(init, container, scope, parentSymbol, false);
            }
            //todo: parse pcall, require for module dependence
            if (init.type == 'CallExpression' || init.type == 'StringCallExpression') {
                switch (init.base.name) {
                    case 'require':
                        let moduleNode = init.argument || init.arguments[0];
                        newSymbol.alias = utils.parseModuleName(moduleNode.value) || '<dynamic-module>';
                        break;
                    case 'pcall':
                        if (init.arguments[0].name == 'require') {
                            newSymbol.alias = utils.parseModuleName(init.arguments[1].value) || '<dynamic-module>';
                        }
                        break;
                    default:
                        break;
                }
            }
        }
    }
}