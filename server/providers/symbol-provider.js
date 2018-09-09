'use strict';

const { LoadedPackages } = require('../lib/engine/luaenv');
const { LuaSymbolKind, LuaSymbol } = require('../lib/engine/symbol');
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

        let depth = 0, maxDepth = 5; //防止循环引用导致死循环
        let walker, forall;
        walker = (def, collection) => {
            if (!(def instanceof LuaSymbol)) {
                return;
            }

            if (def.uri === null) {
                return;
            }

            if (depth++ >= maxDepth) {
                return;
            }

            const document = this.coder.document(def.uri);
            const RangeOf = (loc) => {
                return langserver_1.Range.create(document.positionAt(loc[0]), document.positionAt(loc[1]));
            }
            const symbol = langserver_1.DocumentSymbol.create(
                def.name, utils_2.symbolSignature(def), mapSymbolKind(def.kind),
                RangeOf(def.range), RangeOf(def.location),
                def.children
                    ? forall(def.children)
                    : (is.luaTable(typeOf(def))
                        ? forall(utils_1.object2Array(def.type.fields))
                        : void 0)
            );

            collection.push(symbol);
            depth--;
        }

        forall = (children) => {
            const collection = [];
            children.forEach(child => {
                walker(child, collection);
            });
            return collection;
        }

        let symbols = forall(mdl.children);
        return symbols;
    }
};

exports.SymbolProvider = SymbolProvider;
