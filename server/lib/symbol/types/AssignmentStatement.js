'use strict';
const traits = require('../symbol-traits');
const utils  = require('../utils');

exports.parse = (walker, node, container, scope, parentSymbol, isDef) => {
    for (let i = 0; i < node.variables.length; i++) {
        let variable = node.variables[i];
        walker.walkNode(variable, container, scope, parentSymbol, false);

        if (node.init && node.init[i]) {
            let init = node.init[i];
            walker.walkNode(init, container, scope, parentSymbol, false);
        }
    }
}