'use strict';

const { typeOf, findDef } = require('./typeof');
const { object2Array } = require('./utils');
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
    const names = context.names;
    const length = names.length;
    let def = findDef(names[0], context.uri, context.range);
    if (!def) {
        return [];
    }

    let type = def.type;
    if (Is.lazyValue(type)) {
        type = typeOf(def); //try deduce type
    }

    if (length === 1) {
        return [def];
    }

    if (!Is.luaTable(type) && !Is.luaModule(type)) {
        return [];
    }

    for (let i = 1; i < (length - 1); i++) {
        const name = names[i];
        def = def.type.search(name).value;
        if (!def || !Is.luaTable(typeOf(def))) {
            return [];
        }
    }

    def = def.type.search(names[length - 1]).value;
    if (def) {
        return [def];
    }

    return [];
}

module.exports = {
    DefinitionContext, definitionProvider
};
