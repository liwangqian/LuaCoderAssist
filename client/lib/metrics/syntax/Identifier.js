/*globals require, exports */

'use strict';

var traits = require('escomplex-traits'),
    utils = require('../lib/utils');

exports.get = get;

function get() {
    return traits.actualise(0, 0, undefined,
        (node) => {
            return utils.safeName(node);
        });
}
