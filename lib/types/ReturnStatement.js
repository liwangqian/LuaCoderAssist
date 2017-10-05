'use strict';

exports.parse = (walker, node, container, scope, parentNode) => {
    node.arguments && walker.walkNodes(node.arguments, container, scope, parentNode);
}