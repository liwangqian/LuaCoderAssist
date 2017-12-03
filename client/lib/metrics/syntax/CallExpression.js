/*globals require, exports */

'use strict';

var traits = require('escomplex-traits'),
    utils = require('../lib/utils');

exports.get = get;

function get() {
    return traits.actualise(
        0, 0, '()', undefined, ['base', 'arguments'], undefined, undefined,
        function (node) {
            if (node.base.type === 'Identifier' && node.base.name === 'require') {
                return utils.processRequire(node);
            } else if (node.base.type === 'Identifier' && node.base.name === 'pcall') {
                if (node.arguments[0].type === 'Identifier' && node.arguments[0].name === 'require') {
                    return utils.processPCall(node);
                }
            }
        }
    );
}
