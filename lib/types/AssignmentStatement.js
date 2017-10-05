'use strict';

exports.parse = (walker, node, container, scope, parentNode) => {
    for (var i = 0; i < node.variables.length; i++) {
        var variable = node.variables[i];
        walker.walkNode(variable, container, scope, parentNode);

        if (node.init && node.init[i]) {
            var init = node.init[i];
            walker.walkNode(init, container, scope, parentNode);
        }
    }
}