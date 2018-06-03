'use strict';

const { typeOf, findDef } = require('./typeof');

class CompleteContext {
    /**
     * 
     * @param {String} expr completion expression, eg. `abc.def:hg()` => `abc:def:gh`
     * @param {Array<Number>} range 
     * @param {String} uri 
     */
    constructor(expr, range, uri) {
        this.names = expr.trim().split(/[\.\:]/);
        this.range = range;
        this.uri = uri;
    }
};

/**
 * 
 * @param {CompleteContext} context 
 */
function completionProvider(context) {

}

module.exports = {
    CompleteContext, completionProvider
}
