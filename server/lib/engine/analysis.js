'use strict';

const { _G, LoadedPackages } = require('./luaenv');
const { analysis } = require('./core');
const { typeOf } = require('./typeof');

function parseDocument(code, uri, logger) {
    try {
        let m = analysis(code, uri);
        const _package = _G.get('package');
        if (_package) {
            typeOf(_package); // deduce type.
            const loaded = _package.get('loaded');
            let loadedModules = loaded.get(m.name);
            if (!loadedModules) {
                loadedModules = {};
                loaded.set(m.name, loadedModules);
            }
            loadedModules[m.uri] = m;
        }

        // 用于方便查找定义
        LoadedPackages[uri] = m;
    } catch (err) {
        logger.error(err.stack);
    }
}

module.exports = {
    parseDocument
};
