'use strict';

const anonymous = '<anonymous>'
function identName(ident) {
    if (ident) {
        return ident.name || identName(ident.identifier);
    } else {
        return null;
    }
}

function baseName(ident) {
    if (ident && ident.base) {
        return ident.base.name;
    } else {
        return null;
    }
}

function safeName(node) {
    return node.name || '@(' + node.range + ')';
}

module.exports = {
    identName,
    baseName,
    safeName
};
