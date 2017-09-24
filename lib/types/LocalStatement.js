'use strict';

var traits = require('../symbol-traits');
var utils  = require('../utils');

exports.parse = (walker, node, container, scope, parentNode) => {
    for (var i = 0; i < node.variables.length; i++) {
        var variable = node.variables[i];
        var newSymbol = traits.symbol(utils.safeName(variable), traits.SymbolKind.variable, true);
        newSymbol.scope     = scope;
        newSymbol.container = container;
        newSymbol.location  = variable.loc;
        newSymbol.uri       = walker.document.uri;

        walker.addSymbol(newSymbol);

        if (node.init && node.init[i]) {
            var init = node.init[i];
            if (init.type == 'TableConstructorExpression') {
                newSymbol.kind = traits.SymbolKind.class;
                walker.walkNodes(init.fields, container, scope, variable);
            } else {
                walker.walkNode(init, container, scope, parentNode);
            }
        }
    }
}