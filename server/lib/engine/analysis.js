'use strict';

const { Package } = require('./luaenv');
const { analysis } = require('./core');

function parseDocument(code, uri) {
    let m = analysis(code, uri);
    Package.loaded.set(uri, m);
    Package.uriMap.set(m.name, uri);
}

module.exports = {
    parseDocument
};
