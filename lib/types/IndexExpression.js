'use strict';

var traits = require('../symbol-traits');
var utils  = require('../utils');

exports.parse = (walker, node, container, scope, parentNode) => {
    if (node.index.type != 'StringLiteral') {
        return;
    }

    var name = node.index.value;
    var prop = traits.symbol(name, traits.SymbolKind.property, utils.isLocal(node.base));
    prop.container = container;
    prop.location  = node.index.loc;
    prop.scope     = scope;
    prop.uri       = walker.document.uri;
    prop.bases     = utils.extractBases(node);

    walker.addSymbol(prop);
}