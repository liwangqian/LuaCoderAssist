'use strict';

const { _G, LoadedPackages } = require('./luaenv');
const { analysis } = require('./core');

function parseDocument(code, uri, logger) {
    try {
        let m = analysis(code, uri);
        const loaded = _G.get('package').get('loaded');
        const loadedModules = loaded.get(m.name) || [];
        loadedModules.push(m);
        loaded.set(m.name, loadedModules);
        // 用于方便查找定义
        LoadedPackages[uri] = m;
    } catch (err) {
        logger.error(err.stack);
    }
}

module.exports = {
    parseDocument
};
