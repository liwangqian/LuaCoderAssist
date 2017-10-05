'use strict';

var traits = require('../symbol-traits');
var utils  = require('../utils');

exports.parse = (walker, node, container, scope, parentNode) => {
    //parse key:
    var prop = traits.symbol(utils.safeName(node.key), traits.SymbolKind.property, false);
    prop.scope     = scope;
    prop.container = container;
    prop.location  = utils.loc2Range(node.key.loc);
    prop.bases.push(utils.safeName(parentNode));

    walker.addDef(prop);

    //parse value:
    node.value && walker.walkNode(node.value, container, scope, parentNode);
}