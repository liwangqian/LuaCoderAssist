'use strict';

const traits = require('../symbol-traits');
const utils  = require('../utils');
const path_1 = require('path');

exports.parse = (walker, node, container, scope, parentNode) => {
    let name = utils.safeName(node.base);

    // parse module and dependence
    if (name === 'module') {
        parseModule(walker, node, container, scope, parentNode);
    } else if (name === 'require') {
        parseDependence(walker, node, container, scope, parentNode);
    } else if ((name == 'pcall') && (node.arguments[0].value == 'require')) {
        parseDependencePcall(walker, node, container, scope, parentNode);
    }

    let call = traits.symbol(name, traits.SymbolKind.reference, utils.isLocal(node.base));
    call.container = container;
    call.location  = utils.getLocation(node.base);
    call.bases     = utils.extractBases(node.base);

    walker.addRef(call);
    utils.parseBase(walker, node.base, container, scope, node, traits);

    node.arguments && walker.walkNodes(node.arguments, container, scope, parentNode);
    node.argument && walker.walkNode(node.argument, container, scope, parentNode);
}

function parseModule(walker, node, container, scope, parentNode) {
    let moduleNode = node.argument || node.arguments[0];
    let moduleName = moduleNode.value;
    let module = traits.symbol(moduleName, traits.SymbolKind.module, false);
    module.location = utils.getLocation(moduleNode);
    module.container = {name: container.name};
    container.name = moduleName;
    walker.addMod(module);
}

function parseDependence(walker, node, container, scope, parentNode) {
    let moduleNode = node.argument || node.arguments[0];
    if (!moduleNode.value) {
        return;
    }
    walker.addDep(createDependenceSymbol(moduleNode, container, scope));
}

function parseDependencePcall(walker, node, container, scope, parentNode) {
    let moduleNode = node.arguments[1];
    if (!moduleNode.value) {
        return;
    }
    walker.addDep(createDependenceSymbol(moduleNode, container, scope));
}

function createDependenceSymbol(moduleNode, container, scope) {
    let moduleName = moduleNode.value;
    let m = moduleName.match(/\w+$/);
    if (m) {
        moduleName = m[0];
    }

    let dep = traits.symbol(moduleName, traits.SymbolKind.dependence, false);
    dep.location  = utils.getLocation(moduleNode);
    dep.scope     = scope;
    dep.container = container;

    if (moduleNode.value.includes('.')) {
        dep.shortPath = moduleNode.value.replace('.', path_1.sep);
    }

    return dep;
}