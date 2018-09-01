'use strict';

const { LoadedPackages } = require('../lib/engine/luaenv');
const { LuaSymbolKind } = require('../lib/engine/symbol');
const { typeOf } = require('../lib/engine/typeof');
const is = require('../lib/engine/is');
const utils_1 = require('../lib/engine/utils');
const utils_2 = require('./lib/utils');
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
                if (def.name === 'self') {
                    return;
                }
                defs.push(def);
            }
        });

        let mapper;
        mapper = (def) => {
            const document = this.coder.document(def.uri);
            const rstart = document.positionAt(def.range[0]);
            const rend = document.positionAt(def.range[1]);
            const sstart = document.positionAt(def.location[0]);
            const send = document.positionAt(def.location[1]);
            return langserver_1.DocumentSymbol.create(
                def.name,
                utils_2.symbolSignature(def),
                mapSymbolKind(def.kind),
                langserver_1.Range.create(rstart, rend),
                langserver_1.Range.create(sstart, send),
                is.luaTable(typeOf(def))
                    ? utils_1.object2Array(def.type.fields).map(mapper)
                    : void 0
            );
        }

        let symbols = defs.map(mapper);
        return symbols;
    }
};

exports.SymbolProvider = SymbolProvider;
