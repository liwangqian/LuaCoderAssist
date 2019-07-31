'use strict';

const { DefinitionContext, definitionProvider, LoadedPackages } = require('../lib/engine');
const utils = require('./lib/utils');
const awaiter = require('./lib/awaiter');
const langserver_1 = require('vscode-languageserver');

class HoverProvider {
    constructor(coder) {
        this.coder = coder;
    }

    provideHover(params) {
        return awaiter.await(this, void 0, void 0, function* () {
            let position = params.position;
            if (position.character == 0) {
                return undefined;
            }

            let uri = params.textDocument.uri;
            let document = yield this.coder.document(uri);
            let ref = utils.symbolAtPosition(position, document, { backward: true, forward: true });
            if (ref === undefined) {
                return undefined;
            }

            let defs = definitionProvider(new DefinitionContext(ref.name, ref.range, uri));

            let hovers = [];
            defs.forEach(d => {
                const variants = d.type.variants;
                if (!variants) {
                    let hover = this._makeHover(d);
                    hovers.push(hover);
                } else {
                    variants.forEach((_, override) => {
                        let hover = this._makeHover(d, override);
                        hovers.push(hover);
                    });
                }
            });

            return {
                contents: {
                    kind: langserver_1.MarkupKind.Markdown,
                    value: hovers.join('  \r\n')
                }
            };
        });
    }

    _makeHover(symbol, override) {
        const desc = (override !== undefined) ? symbol.type.variants[override].description : (symbol.type.description || '');
        const link = symbol.type.link;
        const more = (link ? `  \r\n[more...](${link})` : '');
        return `\`\`\`lua\n${utils.symbolSignature(symbol, override)}\r\n\`\`\`` + `\r\n${desc}${more}`;
    }
};

exports.HoverProvider = HoverProvider;