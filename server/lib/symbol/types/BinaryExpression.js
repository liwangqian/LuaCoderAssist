'use strict';

var traits = require('../symbol-traits');
var utils  = require('../utils');

exports.parse = (walker, node, container, scope, parentSymbol, isDef) => {
    node.left && walker.walkNode(node.left, container, scope, parentSymbol, isDef);
    node.right && walker.walkNode(node.right, container, scope, parentSymbol, isDef);
}