'use strict';

const { LoadedPackages, _G } = require('../lib/engine/luaenv');
const { LuaSymbolKind } = require('../lib/engine/symbol');
const is = require('../lib/engine/is');
const utils_1 = require('../lib/engine/utils');
const langserver_1 = require('vscode-languageserver');

function mapSymbolKind(kind) {
    switch (kind) {
        case LuaSymbolKind.function: return langserver_1.SymbolKind.Function;
        case LuaSymbolKind.class: return langserver_1.SymbolKind.Class;
        case LuaSymbolKind.table: return langserver_1.SymbolKind.Class;
        case LuaSymbolKind.module: return langserver_1.SymbolKind.Module;
        case LuaSymbolKind.property: return langserver_1.SymbolKind.Property;
        default: return langserver_1.SymbolKind.Variable;
    }
}

class SymbolProvider {
    constructor(coder) {
        this.coder = coder;
    }

    provideDocumentSymbols(uri) {
        const mdl = LoadedPackages[uri];
        if (!mdl) {
            return [];
        }

        let defs = utils_1.object2Array(mdl.type.fields).concat(...utils_1.object2Array(mdl.type.menv.globals.fields));
        let stack = mdl.type.menv.stack;
        let showFunctionGlobalOnly = this.coder.settings.symbol.showFunctionGlobalOnly;
        stack.forEach((def) => {
            if (!showFunctionGlobalOnly || !def.isLocal || is.luaFunction(def.type) || is.luaTable(def.type)) {
                defs.push(def);
                if (is.luaTable(def.type)) {
                    defs.push(...utils_1.object2Array(def.type.fields));
                }
            }
        });

        return defs.map(def => {
            const document = this.coder.document(def.uri);
            const start = document.positionAt(def.location[0]);
            const end = document.positionAt(def.location[1]);
            return langserver_1.SymbolInformation.create(
                def.name,
                mapSymbolKind(def.kind),
                langserver_1.Range.create(start, end),
                def.uri, def.container);
        });
    }
};

exports.SymbolProvider = SymbolProvider;
