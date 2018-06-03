'use strict';

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

function object2Array(obj) {
    let array = [];
    for (const key in obj) {
        array.push(obj[key]);
    }
    return array;
}

module.exports = {
    identName,
    baseName,
    safeName,
    object2Array
};
