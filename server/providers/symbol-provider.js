'use strict';

const { LoadedPackages } = require('../lib/engine/luaenv');
const { LuaSymbolKind, LuaSymbol } = require('../lib/engine/symbol');
const { typeOf } = require('../lib/engine/typeof');
const is = require('../lib/engine/is');
const utils_1 = require('../lib/engine/utils');
const utils_2 = require('./lib/utils');
const awaiter = require('./lib/awaiter');
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
        this._isShow = (name) => {
            return coder.settings.symbol.showAnonymousFunction || !name.includes("@");
        }
    }

    provideDocumentSymbols(uri) {
        return awaiter.await(this, void 0, void 0, function* () {
            const mdl = LoadedPackages[uri];
            if (!mdl) {
                return [];
            }

            let depth = 0, maxDepth = 5; //防止循环引用导致死循环
            let walker, collectAllChildren;
            walker = (def, collection) => {
                return awaiter.await(this, void 0, void 0, function* () {
                    if (!(def instanceof LuaSymbol)) {
                        return;
                    }

                    if (def.uri !== uri) {
                        return;
                    }

                    if (depth++ >= maxDepth) {
                        depth--;
                        return;
                    }

                    if (!this._isShow(def.name)) {
                        return;
                    }

                    const document = yield this.coder.document(def.uri);
                    const RangeOf = (start, end) => {
                        return langserver_1.Range.create(document.positionAt(start), document.positionAt(end));
                    }
                    const symbol = langserver_1.DocumentSymbol.create(
                        def.name, utils_2.symbolSignature(def), mapSymbolKind(def.kind),
                        RangeOf(def.location[0], def.range[1]), RangeOf(def.location[0], def.location[1]),
                        def.children
                            ? yield collectAllChildren(def.children)
                            : (is.luaTable(typeOf(def))
                                ? yield collectAllChildren(utils_1.object2Array(def.type.fields))
                                : void 0)
                    );

                    collection.push(symbol);
                    depth--;
                });
            }

            collectAllChildren = (children) => {
                return awaiter.await(this, void 0, void 0, function* () {
                    const collection = [];
                    for (let i = 0; i < children.length; i++) {
                        const child = children[i];
                        yield walker(child, collection);
                    }
                    return collection;
                });
            }

            let symbols = yield collectAllChildren(mdl.children);
            return symbols;
        });
    }
};

exports.SymbolProvider = SymbolProvider;
