/*globals require, exports */

'use strict';

var traits = require('escomplex-traits'),
    utils = require('../lib/utils');

exports.get = get;

function get() {
    return traits.actualise(0, 0, "(\"\")", undefined, ["base", "argument"], undefined, undefined,
        (node) => {
            if (node.base.type === 'Identifier' && node.base.name === 'require') {
                return utils.processRequire(node);
            }
        });
}
