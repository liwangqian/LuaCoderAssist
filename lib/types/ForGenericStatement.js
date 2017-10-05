'use strict';

var utils  = require('../utils');
var ident  = require('./Identifier');

exports.parse = (walker, node, container, scope, parentNode) => {
    var newScope = utils.loc2Range(node.loc);
    for (var i = 0; i < node.variables.length; i++) {
        var variable = node.variables[i];
        ident.parse(walker, variable, container, newScope, node, true);
    }

    node.iterators && walker.walkNodes(node.iterators, container, newScope, node);

    node.body && walker.walkNodes(node.body, container, newScope, node);
}