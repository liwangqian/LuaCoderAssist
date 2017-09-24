'use strict';

var traits = require('../symbol-traits');
var utils  = require('../utils');

exports.parse = (walker, node, container, scope, parentNode) => {
    node.condition && walker.walkNode(node.condition, container, node.loc, parentNode);
    node.body && walker.walkNodes(node.body, container, node.loc, parentNode);
}