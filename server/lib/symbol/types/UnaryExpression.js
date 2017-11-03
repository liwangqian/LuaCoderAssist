'use strict';

exports.parse = (walker, node, container, scope, parentSymbol, isDef) => {
    node.argument && walker.walkNode(node.argument, container, scope, parentSymbol, false);
}