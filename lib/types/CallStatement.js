'use strict';

var traits = require('../symbol-traits');
var utils  = require('../utils');

exports.parse = (walker, node, container, scope, parentNode) => {
    node.expression && walker.walkNode(node.expression, container, scope, parentNode);
}