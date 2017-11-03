'use strict';

var traits = require('../symbol-traits');
var utils  = require('../utils');

exports.parse = (walker, node, container, scope, parentSymbol) => {
    //parse key:
    var prop = traits.symbol(utils.safeName(node.key), traits.SymbolKind.property, false);
    prop.scope     = scope;
    prop.container = container;
    prop.location  = utils.loc2Range(node.key.loc);
    prop.bases     = prop.bases.concat(parentSymbol.bases, parentSymbol.name);

    walker.addDef(prop);

    if (node.value.type == 'FunctionDeclaration') {
        prop.kind = traits.SymbolKind.function;
        prop.params = node.value.parameters.map(p => { return p.name; });
    }

    //parse value:
    node.value && walker.walkNode(node.value, container, scope, prop, true);
}