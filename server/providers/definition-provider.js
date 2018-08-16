'use strict';

const { DefinitionContext, definitionProvider } = require('../lib/engine/definition');
const utils_2 = require('./lib/utils');
const langserver_1 = require('vscode-languageserver');

class DefinitionProvider {
    constructor(coder) {
        this.coder = coder;
    }

    provideDefinitions(params) {
        let uri = params.textDocument.uri;
        let position = params.position;
        let document = this.coder.document(uri);
        let ref = utils_2.symbolAtPosition(position, document, { backward: true, forward: true });
        if (ref === undefined) {
            return [];
        }

        let allDefs = definitionProvider(new DefinitionContext(ref.name, ref.range, uri));

        return allDefs.map(d => {
            const start = document.positionAt(d.location[0]);
            const end = document.positionAt(d.location[1]);
            return {
                uri: uri,
                name: d.name,
                range: langserver_1.Range.create(start, end)
            };
        });
    }
};

exports.DefinitionProvider = DefinitionProvider;