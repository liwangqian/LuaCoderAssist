'use strict';

var traits = require('../symbol-traits');
var utils  = require('../utils');

exports.parse = (walker, node, container, scope, parentSymbol, isDef) => {
    let name = utils.safeName(node);
    let kind = isDef ? traits.SymbolKind.variable : traits.SymbolKind.reference;
    let ref  = traits.symbol(name, kind, utils.isLocal(node));
    ref.container = container;
    ref.location  = utils.getLocation(node);
    ref.bases     = utils.extractBases(node);
    if (isDef) {
        ref.scope = scope;
        walker.addDef(ref);
    } else {
        walker.addRef(ref);
    }

    utils.parseBase(walker, node, container, scope, parentSymbol, traits);
}