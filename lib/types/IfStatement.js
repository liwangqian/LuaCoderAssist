'use strict';

exports.parse = (walker, node, container, scope, parentNode) => {
    node.clauses && walker.walkNodes(node.clauses, container, scope, parentNode);
}