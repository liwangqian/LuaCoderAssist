'use strict';

const utils_1        = require('./lib/utils');
const symbol_manager = require('./lib/symbol-manager');
const langserver     = require('vscode-languageserver');

class RenameProvider {
    constructor(coder) {
        this.coder = coder;
    }

    provideRename(params) {
        let newName = params.newName;
        if (!(/^\w+$/.test(newName))) {
            return {
                code: -9,
                message: 'invalid newName "' + newName + '"'
            }
        }

        let uri = params.textDocument.uri;
        let document = this.coder.document(uri);
        let ref = utils_1.symbolAtPosition(params.position, document, {backward: true, forward: true});
        if (ref === undefined) {
            return {
                code: -8,
                message: 'invalid expression'
            }
        }

        let sm = symbol_manager.instance();
        let docsym = sm.documentSymbol(uri);
        if (!docsym) {
            return {
                code: -7,
                message: 'document parse failed'
            };
        }

        let defs = utils_1.filterModDefinitions(docsym.definitions(), ref, true);
        if (defs.length === 0) {
            return {
                code: -6,
                message: 'rename can only apply to local defined variables'
            };
        }

        let refs = utils_1.findAllReferences(docsym.references(), defs[0]);

        let textEdits = defs.concat(refs).map(o => {
            return langserver.TextEdit.replace(o.location, newName);
        });

        return {
            changes: {
                [uri] : textEdits
            }
        };
    }
};

exports.RenameProvider = RenameProvider;
