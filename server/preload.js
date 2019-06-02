'use strict';

const engine = require('./lib/engine');
const uri_1 = require('vscode-uri').default;
const awaiter = require('./providers/lib/awaiter');
const utils_1 = require('./providers/lib/utils');
const fs_1 = require('fs');
const path_1 = require('path');

const STD_PRELOADS = {
    '5.1': 'stdlibs/5_1.json',
    '5.2': 'stdlibs/5_2.json',
    '5.3': 'stdlibs/5_3.json'
}

const LOVE_PRELOAD = 'stdlibs/love.json';
const LUAJIT_PRELOAD = 'stdlibs/luajit-2_0.json';

function loadAll(coder) {
    const preloads = coder.settings.preloads;
    const luaversion = coder.luaversion;
    const filePath = coder.extensionPath + (STD_PRELOADS[luaversion] || 'stdlibs/5_3.json');

    coder.tracer.info('loading STD library ...');
    engine.loadExtentLib(filePath, "std.lua"); // load stdlib

    preloads.forEach(filePath => {
        load(filePath, coder);
    });

    if (coder.settings.useLove) {
        coder.tracer.info('loading LOVE library ...');
        engine.loadExtentLib(coder.extensionPath + LOVE_PRELOAD, "love.lua");
    }

    if (coder.settings.useJit) {
        coder.tracer.info('loading JIT library ...');
        engine.loadExtentLib(coder.extensionPath + LUAJIT_PRELOAD, "jit.lua");
    }

    // TODO: add watcher for the modification of the rc file to avoid reload vscode.
    const rcFilePath = coder.workspaceRoot + '\\.luacompleterc';
    engine.loadExtentLib(rcFilePath);
}

function load(filePath, coder) {
    let stats = fs_1.lstatSync(filePath);
    if (!stats) {
        coder.tracer.error(`failed to load ${filePath}, not a regular path.`);
        return;
    }

    if (stats.isFile()) {
        coder.tracer.info(`loading ${filePath} ...`);
        loadFile(filePath, coder);
        return;
    }

    if (stats.isDirectory()) {
        const moduleWithInitFile = path_1.join(filePath, 'init.lua');
        if (fs_1.existsSync(moduleWithInitFile)) {
            coder.tracer.info(`loading ${moduleWithInitFile} ...`);
            loadFile(moduleWithInitFile, coder);
        } else {
            utils_1.searchFile(filePath, coder.settings.search, (root, name) => {
                if (path_1.extname(name) === '.lua') {
                    const fileFound = path_1.resolve(root, name);
                    coder.tracer.info(`loading ${fileFound} ...`);
                    loadFile(fileFound, coder);
                }
            }, () => {});
        }
        return;
    }

    return;
}

function loadFile(filePath, coder) {
    return awaiter.await(void 0, void 0, void 0, function* () {
        const uri = uri_1.file(filePath).toString();
        const document = yield coder.document(uri);
        engine.parseDocument(document.getText(), uri, coder.tracer);
    });
}

exports.loadAll = loadAll;
exports.load = load;
