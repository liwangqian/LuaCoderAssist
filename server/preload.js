'use strict';

const engine = require('./lib/engine');
const uri_1 = require('vscode-uri').default;

const STD_PRELOADS = {
    '5.1': 'stdlibs/lua_5_1.lua',
    '5.2': 'stdlibs/lua_5_2.lua',
    '5.3': 'stdlibs/lua_5_3.lua'
}

function loadAll(coder) {
    const preloads = coder.settings.preloads;
    const luaversion = coder.luaversion;
    const filePath = coder.extensionPath + (STD_PRELOADS[luaversion] || 'stdlibs/lua_5_3.lua');

    load(filePath, coder);

    preloads.forEach(filePath => {
        load(filePath, coder);
    });
}

function load(filePath, coder) {
    const uri = uri_1.file(filePath).toString();
    const document = coder.document(uri);
    engine.parseDocument(document.getText(), uri, coder.tracer);
}

exports.loadAll = loadAll;
exports.load = load;