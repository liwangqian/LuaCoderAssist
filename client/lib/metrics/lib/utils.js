'use strict';

function safeName(node) {
    if (node) {
        return node.name || safeName(node.identifier) || safeName(node.base);
    } else {
        return '<anonymous>';
    }
}

exports.safeName = safeName;

exports.processRequire = processRequire;
function processRequire(node) {
    let moduleName = node.argument || node.arguments[0];
    return createDependency(node, resolveRequireDependency(moduleName, "require"));
}

function resolveRequireDependency(dependency) {
    if (dependency.type === 'StringLiteral') {
        return dependency.value;
    }

    return '* dynamic dependency *';
}

function createDependency(node, path, type) {
    return {
        line: node.loc.start.line,
        path: path,
        type: type
    };
}

exports.processPCall = processPCall;
function processPCall(node) {
    return createDependency(node, resolvePCallDependency(node.arguments[1]), 'pcall');
}

function resolvePCallDependency(dependency) {
    if (dependency.type === 'StringLiteral') {
        return dependency.value;
    }

    return '* dynamic dependency *';
}

