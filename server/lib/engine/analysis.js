'use strict';

const { _G, LoadedPackages } = require('./luaenv');
const { analysis } = require('./core');
const { typeOf } = require('./typeof');

function parseDocument(code, uri, logger) {
    try {
        invalidateModuleSymbols(uri);

        let mdl = analysis(code, uri);
        const _package = _G.get('package');
        if (_package) {
            typeOf(_package); // deduce type.
            const loaded = _package.get('loaded');
            let loadedModules = loaded.get(mdl.name);
            if (!loadedModules) {
                loadedModules = {};
                loaded.set(mdl.name, loadedModules);
            }
            loadedModules[uri] = mdl;
        }

        // 用于方便查找定义
        LoadedPackages[uri] = mdl;
        clearInvalidSymbols();
        return mdl;
    } catch (err) {
        logger.error(err.stack);
        return null;
    }
}

function invalidateModuleSymbols(uri) {
    const _package = LoadedPackages[uri];
    if (_package) {
        _package.invalidate();
    }
}

function clearInvalidSymbols() {
    let globals = _G.type.fields;
    for (const name in globals) {
        if (!globals[name].valid) {
            delete globals[name];
        }
    }
}

module.exports = {
    parseDocument
};
