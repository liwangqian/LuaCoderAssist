'use strict';

const engine = require('./lib/engine');
const uri_1 = require('vscode-uri').default;
const extend_1 = require('./lib/engine/extend');

const STD_PRELOADS = {
    '5.1': 'stdlibs/5_1.json',
    '5.2': 'stdlibs/5_2.json',
    '5.3': 'stdlibs/5_3.json'
}

function loadAll(coder) {
    const preloads = coder.settings.preloads;
    const luaversion = coder.luaversion;
    const filePath = coder.extensionPath + (STD_PRELOADS[luaversion] || 'stdlibs/5_3.json');

    extend_1.loadExtentLib(filePath); // load stdlib

    preloads.forEach(filePath => {
        extend_1.loadExtentLib(filePath);
    });

    // TODO: add watcher for the modification of the rc file to avoid reload vscode.
    const rcFilePath = coder.workspaceRoot + '\\.luacompleterc';
    extend_1.loadExtentLib(rcFilePath);
}

function load(filePath, coder) {
    const uri = uri_1.file(filePath).toString();
    const document = coder.document(uri);
    engine.parseDocument(document.getText(), uri, coder.tracer);
}

exports.loadAll = loadAll;
exports.load = load;