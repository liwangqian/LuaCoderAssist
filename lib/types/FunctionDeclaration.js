'use strict';

var traits = require('../symbol-traits');
var utils  = require('../utils');

exports.parse = (walker, node, container, scope, parentNode) => {
    var id = node.identifier;
    //consider anonymouse function
    var fname = utils.safeName(id);
    if (id != null) {
        var func = traits.symbol(fname, traits.SymbolKind.function, utils.isLocal(node));
        func.scope     = scope;
        func.container = container;
        func.location  = utils.getLocation(id);
        func.bases     = utils.extractBases(id);

        walker.addSymbol(func);
        utils.parseBase(walker, id, container, scope, node, traits);
    }

    var newScope = node.loc;
    if (node.parameters) {
        var parameters = node.parameters;
        for (var i = 0; i < parameters.length; i++) {
            var param = parameters[i];
            var p = traits.symbol(param.name || param.value, traits.SymbolKind.parameter, true);
            p.container = fname;
            p.location  = param.loc;
            p.scope     = newScope;

            walker.addSymbol(p);
        }
    }

    walker.walkNodes(node.body, fname, newScope, node);
}