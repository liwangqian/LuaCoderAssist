'use strict';

const { DefinitionContext, definitionProvider } = require('../lib/engine/definition');
const utils_2 = require('./lib/utils');

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
            return {
                uri: uri,
                name: d.name,
                range: d.location
            };
        });
    }
};

exports.DefinitionProvider = DefinitionProvider;