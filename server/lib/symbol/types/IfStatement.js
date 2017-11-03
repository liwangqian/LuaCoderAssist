'use strict';

exports.parse = (walker, node, container, scope, parentSymbol, isDef) => {
    node.clauses && walker.walkNodes(node.clauses, container, scope, parentSymbol, false);
}