'use strict';

const symbol_manager_1 = require('./lib/symbol-manager');
const utils_1 = require('../lib/symbol/utils');
const utils_2 = require('./lib/utils');

class DefinitionProvider {
    constructor(coder) {
        this.coder = coder;
    }

    provideDefinitions(params) {
        let uri = params.textDocument.uri;
        let documentSymbol = symbol_manager_1.instance().documentSymbol(uri);
        if (!documentSymbol) {
            return [];
        }

        let document = this.coder.document(uri);
        let ref = utils_2.symbolAtPosition(params.position, document, {backward: true, forward: true});
        if (!ref) {
            return [];
        }

        //todo: 提取函数，考虑bases进去
        // 调用documentSymbol.findDefinitions(ref)
        let defsInFile = documentSymbol.definitions().filter(s => {
            return s.name === ref.name && utils_1.inScope(s.scope, ref.location);
        });

        // find define in dependences
        let defsInDep = utils_2.filterDepDefinitions(
            utils_2.getDefinitionsInDependences(uri, this.coder.tracer),
            ref, true);
        let allDefs = [].concat(defsInFile, defsInDep);

        return allDefs.map(d => {
            return {
                uri: d.uri,
                name: d.name,
                range: d.location
            };
        });
    }
};

exports.DefinitionProvider = DefinitionProvider;