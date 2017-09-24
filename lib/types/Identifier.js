'use strict';

var traits = require('../symbol-traits');
var utils  = require('../utils');

exports.parse = (walker, node, container, scope, parentNode) => {
    var newSymbol = traits.symbol(utils.safeName(node), traits.SymbolKind.reference, utils.isLocal(node));

    newSymbol.container = container;
    newSymbol.location  = node.loc;
    newSymbol.uri       = walker.document.uri;

    walker.addSymbol(newSymbol);
}