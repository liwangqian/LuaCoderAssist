'use strict';

var utils  = require('../utils');
var ident  = require('./Identifier');

exports.parse = (walker, node, container, scope, parentSymbol, isDef) => {
    var newScope = utils.loc2Range(node.loc);
    node.variable && ident.parse(walker, node.variable, container, newScope, node, true);

    ['start', 'end', 'step'].forEach(fid => {
        node[fid] && walker.walkNode(node[fid], container, newScope, node, false);
    });

    node.body && walker.walkNodes(node.body, container, newScope, node);
}