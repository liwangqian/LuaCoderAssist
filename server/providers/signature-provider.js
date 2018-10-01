'use strict';

const utils = require('./lib/utils');
const engine = require('../lib/engine');
const is = require('../lib/engine/is');
const langsever = require('vscode-languageserver');

class SignatureProvider {
    constructor(coder) {
        this.coder = coder;
    }

    provideSignatureHelp(params) {
        let uri = params.textDocument.uri;
        let pos = params.position;
        let doc = this.coder.document(uri);
        let ref = utils.signatureContext(doc.getText(), doc.offsetAt(pos));
        if (ref === undefined) {
            return undefined;
        }

        let defs = engine.definitionProvider(new engine.DefinitionContext(ref.name, ref.range, uri));
        let signatures = [];
        defs.forEach(d => {
            if (!is.luaFunction(d.type)) {
                return;
            }

            if (!d.type.variants) {
                let item = this._newSignature(d, d.type.args, d.type.description);
                signatures.push(item);
            } else {
                d.type.variants.forEach((variant, idx) => {
                    let desc = variant.description || d.type.description;
                    let item = this._newSignature(d, variant.args, desc, idx);
                    signatures.push(item);
                });
            }

        });

        return {
            signatures: signatures,
            activeSignature: signatures.length > 0 ? 0 : null,
            activeParameter: signatures.length > 0 ? ref.param_id : null
        };
    }

    _newSignature(d, args, doc, idx) {
        let item = langsever.SignatureInformation.create(utils.symbolSignature(d, idx));
        item.documentation = this._newDocumentation(doc);
        args.forEach(p => {
            item.parameters.push(langsever.ParameterInformation.create(p.name));
        });

        return item;
    }

    _newDocumentation(doc) {
        return doc && {
            kind: langsever.MarkupKind.Markdown,
            value: doc
        };
    }
};

exports.SignatureProvider = SignatureProvider;