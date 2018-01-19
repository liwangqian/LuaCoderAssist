'use strict';

const symbol_manager = require('./lib/symbol-manager');
const utils = require('./lib/utils');

class HoverProvider {
    constructor(coder) {
        this.coder = coder;
    }

    provideHover(params) {
        let position = params.position;
        if (position.character == 0) {
            return undefined;
        }

        let uri = params.textDocument.uri;
        let document = this.coder.document(uri);
        let ref = utils.symbolAtPosition(position, document, { backward: true, forward: true });
        if (ref === undefined) {
            return undefined;
        }

        // find in current module
        let defs = this._findDefInCurrentModule(uri, ref);

        // find in dependence
        defs = defs.concat(this._findDefInDependence(uri, ref));

        return defs.map(d => {
            let typeDesc = (d.islocal ? '(local ' : '') + utils.symbolKindDesc(d.kind) + (d.islocal ? ') ' : ' ');
            var item = {
                language: document.languageId,
                value: typeDesc + (utils.functionSignature(d) || d.name)
            }
            return item;
        });
    }

    _findDefInCurrentModule(uri, ref) {
        let sm = symbol_manager.instance();
        let docsym = sm.documentSymbol(uri);
        if (!docsym) {
            return [];
        }

        return utils.filterModDefinitions(docsym.definitions(), ref, utils.preciseCompareName);
    }

    _findDefInDependence(uri, ref) {
        return utils.filterDepDefinitions(
            utils.getDefinitionsInDependences(uri, ref, this.coder.tracer),
            ref, utils.preciseCompareName);
    }
};

exports.HoverProvider = HoverProvider;