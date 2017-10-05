'use strict';

var traits = require('../symbol-traits');
var utils  = require('../utils');

exports.parse = (walker, node, container, scope, parentNode, isDef) => {
    var kind = isDef ? traits.SymbolKind.variable : traits.SymbolKind.reference
    var newSymbol = traits.symbol(utils.safeName(node), kind, utils.isLocal(node));
    isDef && (newSymbol.scope = scope);
    newSymbol.container = container;
    newSymbol.location  = utils.loc2Range(node.loc);

    if (isDef) {
        walker.addDef(newSymbol);
    } else {
        walker.addRef(newSymbol);
    }
}