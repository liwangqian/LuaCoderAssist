/*globals require, exports */

'use strict';

var traits = require('escomplex-traits'),
    utils = require('../lib/utils');

exports.get = get;

function get() {
    return traits.actualise(
        (node) => {
            return node.variables.length;
        },
        0, "local",
        (node) => {
            return utils.safeName(node.variables[0]);
        }, ["variables", "init"]);
}
