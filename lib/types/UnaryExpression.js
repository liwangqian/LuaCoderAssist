'use strict';

var traits = require('../symbol-traits');
var utils  = require('../utils');

exports.parse = (walker, node, container, scope, parentNode) => {
    node.argument && walker.walkNode(node.argument, container, scope, parentNode);
}