'use strict';

exports.parse = (walker, node, container, scope, parentNode) => {
    node.index && walker.walkNode(node.index, container, scope, parentNode);
    node.base && walker.walkNode(node.base, container, scope, parentNode);
}