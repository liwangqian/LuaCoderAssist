/*globals require, exports */

'use strict';

var traits = require('escomplex-traits');

exports.get = get;

function get() {
    return traits.actualise(1, 1, "for", undefined, ["variables", "start", "end", "step", "body"]);
}
