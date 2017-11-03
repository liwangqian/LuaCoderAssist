'use strict';

exports.parse = (walker, node, container, scope, parentSymbol, isDef) => {
    node.expression && walker.walkNode(node.expression, container, scope, parentSymbol, false);
}