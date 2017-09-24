'use strict';

var traits = require('../symbol-traits');
var utils  = require('../utils');

exports.parse = (walker, node, container, scope, parentNode) => {
    var prop = traits.symbol(utils.safeName(node.key), traits.SymbolKind.property, false);
    prop.scope     = scope;
    prop.container = container;
    prop.location  = node.key.loc;
    prop.uri       = walker.document.uri;
    prop.bases.push(utils.safeName(parentNode));

    walker.addSymbol(prop);
}