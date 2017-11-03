'use strict';

const traits           = require('../lib/symbol/symbol-traits');
const utils_1          = require('./lib/utils');
const symbol_manager_1 = require('./lib/symbol-manager');
const langserver_1     = require('vscode-languageserver');

class SymbolProvider {
    constructor(coder) {
        this.coder = coder;
        this.symbolManager = symbol_manager_1.instance();
        this.symbolManager.init(coder);
    }

    provideDocumentSymbols(uri) {
        var documentSymbol = this.symbolManager.documentSymbol(uri);
        var definitions = documentSymbol && documentSymbol.definitions();
        definitions = definitions || [];
        
        let showFunctionGlobalOnly = this.coder.settings.symbol.showFunctionGlobalOnly;
        return definitions.filter(def => {
            return showFunctionGlobalOnly ? !def.islocal || def.kind === traits.SymbolKind.function : true;
        }).map(def => {
            return langserver_1.SymbolInformation.create(
                def.name,
                utils_1.mapSymbolKind(def.kind),
                def.location,
                def.uri,
                def.bases[def.bases.length-1] || def.container.name);
        });
    }
};

exports.SymbolProvider = SymbolProvider;
