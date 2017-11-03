'use strict';

exports.parse = (walker, node, container, scope, parentSymbol, isDef) => {
    node.index && walker.walkNode(node.index, container, scope, parentSymbol, false);
    node.base && walker.walkNode(node.base, container, scope, parentSymbol, false);
}