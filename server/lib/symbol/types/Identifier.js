'use strict';

var traits = require('../symbol-traits');
var utils  = require('../utils');

exports.parse = (walker, node, container, scope, parentSymbol, isDef) => {
    var newSymbol = traits.symbol(utils.safeName(node), undefined, utils.isLocal(node));
    newSymbol.container = container;
    newSymbol.location  = utils.loc2Range(node.loc);

    // if symbol is not local defined, should we defined ?
    if (!newSymbol.islocal && isDef === undefined && walker.options.allowDefined) {
        let defs = utils.findDefinition(newSymbol, walker.document.definitions);
        isDef = !defs || (defs.length == 0);
    }

    newSymbol.kind = isDef ? traits.SymbolKind.variable : traits.SymbolKind.reference
    isDef && (newSymbol.scope = scope);

    if (isDef) {
        walker.addDef(newSymbol);
    } else {
        walker.addRef(newSymbol);
    }
}
