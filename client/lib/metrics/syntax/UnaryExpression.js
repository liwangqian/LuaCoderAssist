/*globals require, exports */

'use strict';

var traits = require('escomplex-traits'),
    utils = require('../lib/utils');

exports.get = get;

function get() {
    return traits.actualise(0, 0,
        (node) => {
            return node.operator;
        },
        (node) => {
            return utils.safeName(node.argument);
        },
        ["argument"]);
}
