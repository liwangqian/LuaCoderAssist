/*globals require, exports */

'use strict';

var traits = require('escomplex-traits');

exports.get = get;

function get() {
    return traits.actualise(
        0,
        (node) => {
            return node.operator == 'or' ? 1 : 0;
        },
        (node) => {
            return node.operator;
        }, undefined, ["left", "right"]);
}
