'use strict';

var traits = require('../symbol-traits');
var utils  = require('../utils');

exports.parse = (walker, node, container, scope, parentNode) => {
    if (node.clauses) {
        walker.walkNodes(node.clauses, container, node.loc, parentNode);
    }
}