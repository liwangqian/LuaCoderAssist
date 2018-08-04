'use strict';

const Is = require('./is');

function identName(ident) {
    if (ident) {
        return ident.name || identName(ident.identifier);
    } else {
        return null;
    }
}

function baseName(ident) {
    if (!ident) {
        return null;
    }
    if (ident.base) {
        return baseName(ident.base);
    } else {
        return ident.name;
    }
}

function baseNames(node) {
    let names = [];
    const _iter = (base) => {
        if (!base) {
            return;
        }

        if (base.base) {
            _iter(base.base);
        }

        names.push(identName(base));
    }

    _iter(node);
    return names;
}

function safeName(node) {
    return node.name || '@(' + node.range + ')';
}

function object2Array(obj, filterout) {
    let array = [];
    filterout = filterout || (() => false);
    for (const key in obj) {
        const e = obj[key];
        if (!filterout(e)) {
            array.push(e);
        }
    }
    return array;
}

function directParent(stack, names) {
    let parent = stack.search((data) => data.name === names[0]);
    for (let i = 1; i < names.length; i++) {
        if (parent && Is.luatable(parent.type)) {
            const result = parent.type.search(names[i]);
            parent = result.value;
            continue;
        } else {
            parent = null;
            break;
        }
    }
    return parent;
}

module.exports = {
    identName,
    baseName,
    baseNames,
    safeName,
    directParent,
    object2Array
};
