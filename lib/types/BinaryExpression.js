'use strict';

var traits = require('../symbol-traits');
var utils  = require('../utils');

exports.parse = (walker, node, container, scope, parentNode) => {
    node.left && walker.walkNode(node.left, container, scope, parentNode);
    node.right && walker.walkNode(node.right, container, scope, parentNode);
}