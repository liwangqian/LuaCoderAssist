'use strict';

var traits = require('../symbol-traits');
var utils  = require('../utils');

exports.parse = (walker, node, container, scope, parentNode) => {
    node.arguments && walker.walkNodes(node.arguments, container, scope, parentNode);
}