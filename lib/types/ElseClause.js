'use strict';

var utils = require('../utils');

exports.parse = (walker, node, container, scope, parentNode) => {
    walker.walkNodes(node.body, container, utils.loc2Range(node.loc), parentNode);
}