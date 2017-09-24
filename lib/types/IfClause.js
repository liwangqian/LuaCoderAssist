'use strict';

var traits = require('../symbol-traits');
var utils  = require('../utils');

exports.parse = (walker, node, container, scope, parentNode) => {
    node.condition && walker.walkNode(node.condition, container, scope, parentNode);
    walker.walkNodes(node.body, container, scope, parentNode);
}