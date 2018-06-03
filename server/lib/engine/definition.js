'use strict';

const { typeOf, findDef } = require('./typeof');
const Is = require('./is');

class DefinitionContext {
    /**
     * Context for query definition of a reference
     * @param {String} expr refernce names, eg. `base.func()` => `base.func`
     * @param {Array<Number>} range refernce range, include the base names
     * @param {String} uri uri of the document where reference exist
     */
    constructor(expr, range, uri) {
        this.names = expr.trim().split(/[\.\:]/);
        this.range = range;
        this.uri = uri;
    }
};


/**
 * Provide the definition of the reference
 * @param {DefinitionContext} context query context
 */
function definitionProvider(context) {
    let names = context.names;
    let def = findDef(names[0], context.uri, context.range);
    if (!def) return null;
    if (names.length === 1) return def;
    if (!Is.luatable(def.type)) return null;

    for (let i = 1; i < names.length; i++) {
        const name = names[i];
        def = def.type.get(name);
        if (!def || !Is.luatable(typeOf(def))) {
            break;
        }
    }

    return def;
}

module.exports = {
    DefinitionContext, definitionProvider
};
