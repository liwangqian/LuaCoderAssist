'use strict';

const { DefinitionContext, definitionProvider } = require('../lib/engine/definition');
const awaiter = require('./lib/awaiter');
const utils_1 = require('./lib/utils');
const langserver_1 = require('vscode-languageserver');

class DefinitionProvider {
    constructor(coder) {
        this.coder = coder;
    }

    provideDefinitions(params) {
        return awaiter.await(this, void 0, void 0, function* () {
            let uri = params.textDocument.uri;
            let position = params.position;
            let document = yield this.coder.document(uri);
            let ref = utils_1.symbolAtPosition(position, document, { backward: true, forward: true });
            if (ref === undefined) {
                return [];
            }

            let symbols = definitionProvider(new DefinitionContext(ref.name, ref.range, uri))
                .filter(symbol => {
                    return symbol.uri !== null;
                });

            const defs = [];
            for (let i = 0; i < symbols.length; ++i) {
                const symbol = symbols[i];
                const document = yield this.coder.document(symbol.uri);
                const start = document.positionAt(symbol.location[0]);
                const end = document.positionAt(symbol.location[1]);
                defs.push({
                    uri: symbol.uri,
                    name: symbol.name,
                    range: langserver_1.Range.create(start, end)
                });
            }
            return defs;
        });
    }
};

exports.DefinitionProvider = DefinitionProvider;