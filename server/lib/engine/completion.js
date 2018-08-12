'use strict';

const { LoadedPackages } = require('./luaenv');
const { object2Array } = require('./utils');
const { typeOf, searchInnerStackIndex } = require('./typeof');
const { ScopeEnd } = require('./linear-stack');
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
        this.functionOnly = expr.endsWith(':');
    }
};

/**
 * Provide completion items
 * @param {CompletionContext} context 
 */
function completionProvider(context) {
    const namesLength = context.names.length;
    let theModule = LoadedPackages[context.uri];
    if (!theModule || namesLength === 0) {
        return [];
    }

    let stack = theModule.type.menv.stack;
    let index = searchInnerStackIndex(stack, context.range);
    let skipNode = (node) => ScopeEnd.is(node);

    if (index === 0) {
        return [];
    }

    //Case: abc
    if (namesLength === 1) {
        let symbols = [];
        let node = stack.nodes[index - 1];
        while (node) {
            !skipNode(node) && symbols.push(node.data);
            node = node._prevNode;
        };
        return symbols;
    }

    //Case: abc.x or abc.xy:z ...
    //TODO: support abc().xx
    const name = context.names[0];
    let value = stack.search((S) => {
        return (S.name === name) && (!S.local || S.range[1] <= context.range[0])
    }, index);
    if (!Is.luaTable(typeOf(value)) && !Is.luaModule(value)) {
        return [];
    }

    let def = value;
    const size = namesLength - 1;
    for (let i = 1; i < size; ++i) {
        let name = context.names[i];
        def = def.type.get(name);
        if (!def || !Is.luaTable(typeOf(def))) {
            return [];
        }
    }

    const filter = item => context.functionOnly && !Is.luaFunction(item.type);
    return object2Array(def.type._fields || def.type.returns, filter);
}

module.exports = {
    CompletionContext, completionProvider
}
