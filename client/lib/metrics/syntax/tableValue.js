/*globals require, exports */

'use strict';

var traits = require('escomplex-traits');

exports.get = get;

function get() {
    return traits.actualise(0, 0, undefined, undefined, ['value']);
}
