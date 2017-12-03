/*globals require, exports */

'use strict';

var traits = require('escomplex-traits');

exports.get = get;

function get() {
    return traits.actualise(1, 1, "forin", undefined, ["variables", "iterators", "body"]);
}
