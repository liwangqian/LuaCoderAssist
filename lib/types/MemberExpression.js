'use strict';

var traits = require('../symbol-traits');
var utils  = require('../utils');

exports.parse = (walker, node, container, scope, parentNode) => {
    var name = utils.safeName(node);
    var ref  = traits.symbol(name, traits.SymbolKind.reference, utils.isLocal(node));
    ref.container = container;
    ref.location  = utils.getLocation(node);
    ref.bases     = utils.extractBases(node);

    walker.addRef(ref);

    utils.parseBase(walker, node, container, scope, parentNode, traits);
}