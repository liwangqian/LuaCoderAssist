'use strict';

exports.parse = (walker, node, container, scope, parentNode) => {
    node.argument && walker.walkNode(node.argument, container, scope, parentNode);
}