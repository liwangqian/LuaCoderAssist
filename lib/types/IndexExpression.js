'use strict';

// var traits = require('../symbol-traits');
// var utils  = require('../utils');

exports.parse = (walker, node, container, scope, parentNode) => {
    // if (node.index.type == 'Identifier') {
    //     var name = node.index.name;
    //     var prop = traits.symbol(name, traits.SymbolKind.property, utils.isLocal(node.base));
    //     prop.container = container;
    //     prop.location  = utils.loc2Range(node.index.loc);
    //     prop.scope     = scope;
    //     prop.bases     = utils.extractBases(node);
    
    //     walker.addDef(prop);
    //     utils.parseBase(walker, node, container, scope, node, traits);
    // }
    node.index && walker.walkNode(node.index, container, scope, parentNode);
    node.base && walker.walkNode(node.base, container, scope, parentNode);
}