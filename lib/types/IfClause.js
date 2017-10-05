'use strict';

var utils  = require('../utils');

exports.parse = (walker, node, container, scope, parentNode) => {
    var newScope = utils.loc2Range(node.loc);
    node.condition && walker.walkNode(node.condition, container, newScope, parentNode);
    walker.walkNodes(node.body, container, newScope, parentNode);
}