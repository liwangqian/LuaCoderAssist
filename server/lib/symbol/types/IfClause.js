'use strict';

var utils  = require('../utils');

exports.parse = (walker, node, container, scope, parentSymbol, isDef) => {
    var newScope = utils.loc2Range(node.loc);
    node.condition && walker.walkNode(node.condition, container, newScope, parentSymbol, false);
    walker.walkNodes(node.body, container, newScope, parentSymbol);
}