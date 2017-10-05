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
        func.params    = [];

        walker.addDef(func);
        utils.parseBase(walker, id, container, scope, node, traits);
    }

    var newScope = utils.loc2Range(node.loc);
    if (node.parameters) {
        var parameters = node.parameters;
        for (var i = 0; i < parameters.length; i++) {
            var param = parameters[i];
            var pname = param.name || param.value;
            var p = traits.symbol(pname, traits.SymbolKind.parameter, true);
            p.container = fname;
            p.location  = utils.loc2Range(param.loc);
            p.scope     = newScope;

            walker.addDef(p);

            func && func.params.push(pname);
        }
    }

    walker.walkNodes(node.body, fname, newScope, node);
}