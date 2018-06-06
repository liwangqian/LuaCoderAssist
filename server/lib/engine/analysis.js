'use strict';

const { Package } = require('./luaenv');
const { analysis } = require('./core');

function parseDocument(code, uri, logger) {
    try {
        let m = analysis(code, uri);
        Package.loaded.set(uri, m);
        Package.uriMap.set(m.name, uri);
    } catch (err) {
        logger.error(err);
    }
}

module.exports = {
    parseDocument
};
