'use strict';

const { Package } = require('./luaenv');
const { object2Array } = require('./utils');
const { typeOf, findDef, searchInnerScope } = require('./typeof');
const Is = require('./is');

class CompletionContext {
    /**
     * 
     * @param {String} expr completion expression, eg. `abc.def:hg()` => `abc:def:gh`
     * @param {Array<Number>} range 
     * @param {String} uri 
     */
    constructor(expr, range, uri) {
        this.expr = expr;
        this.names = expr.trim().split(/[\.\:]/);
        this.range = range;
        this.uri = uri;
    }
};

/**
 * Provide completion items
 * @param {CompletionContext} context 
 */
function completionProvider(context) {
    const namesLength = context.names.length;
    let theModule = Package.loaded.get(context.uri);
    if (!theModule || namesLength === 0) {
        return [];
    }

    let scope = searchInnerScope(theModule.type.scope, context.range);

    //Case: abc
    if (namesLength === 1) {
        let symbols = [];
        do {
            symbols.push(...object2Array(scope.symbols));
        } while ((scope = scope.parentScope));
        return symbols;
    }

    //Case: abc.x or abc.xy:z ...
    //TODO: support abc().xx
    let { value } = scope.search(context.names[0]);
    if (!Is.luatable(typeOf(value)) && !Is.luamodule(value)) {
        return [];
    }

    let def = value;
    const size = namesLength - 1;
    for (let i = 1; i < size; ++i) {
        let name = context.names[i];
        def = def.type.get(name);
        if (!def || !Is.luatable(typeOf(def))) {
            return [];
        }
    }

    return object2Array(def.type.fields || def.type.exports);
}

module.exports = {
    CompletionContext, completionProvider
}
