'use strict';

exports.parse = (walker, node, container, scope, parentNode) => {
    node.expression && walker.walkNode(node.expression, container, scope, parentNode);
}