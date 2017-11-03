'use strict';

const traits = require('../symbol-traits');
const utils  = require('../utils');

exports.parse = (walker, node, container, scope, parentSymbol, isDef) => {
    let id = node.identifier;
    //consider anonymouse function
    let fname = utils.safeName(id);
    let func = undefined;
    if (id != null) {
        func = traits.symbol(fname, traits.SymbolKind.function, utils.isLocal(id)); // utils.isLocal(node)
        func.scope     = scope;
        func.container = container;
        func.location  = utils.getLocation(id);
        func.bases     = utils.extractBases(id);
        func.params    = [];

        walker.addDef(func);
        utils.parseBase(walker, id, container, scope, node, traits);
    }

    let newScope = utils.loc2Range(node.loc);
    let newContainer = {name: fname};
    if (node.parameters) {
        let parameters = node.parameters;
        for (let i = 0; i < parameters.length; i++) {
            let param = parameters[i];
            let pname = param.name || param.value;
            let p = traits.symbol(pname, traits.SymbolKind.parameter, true);
            p.container = newContainer;
            p.location  = utils.loc2Range(param.loc);
            p.scope     = newScope;

            walker.addDef(p);

            func && func.params.push(pname);
        }
    }

    walker.walkNodes(node.body, newContainer, newScope, node);
}