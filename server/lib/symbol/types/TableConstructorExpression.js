'use strict';

exports.parse = (walker, node, container, scope, parentSymbol, isDef) => {
    walker.walkNodes(node.fields, container, scope, parentSymbol, isDef);        
}