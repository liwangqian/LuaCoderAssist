'use strict';

var traits = require('../symbol-traits');
var utils  = require('../utils');

exports.parse = (walker, node, container, scope, parentNode) => {
    var id = node.identifier;
    var func = traits.symbol(utils.safeName(id), traits.SymbolKind.function, utils.isLocal(node));

    func.scope     = scope;
    func.container = container;
    func.location  = utils.getLocation(id);
    func.uri       = walker.document.uri;
    func.bases     = utils.extractBases(id);

    walker.addSymbol(func);

    var newScope = node.loc;
    if (node.parameters) {
        var parameters = node.parameters;
        for (var i = 0; i < parameters.length; i++) {
            var param = parameters[i];
            var p = traits.symbol(param.name || param.value, traits.SymbolKind.parameter, true);
            p.container = func.name;
            p.location  = param.loc;
            p.scope     = newScope;
            p.uri       = walker.document.uri;

            walker.addSymbol(p);
        }
    }

    walker.walkNodes(node.body, func.name, newScope, node);
}