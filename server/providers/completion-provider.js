'use strict';

const langserver = require('vscode-languageserver');
const utils = require('./lib/utils');
const engine = require('../lib/engine');
const is = require('../lib/engine/is');

class CompletionProvider {
    constructor(coder) {
        this.coder = coder;
        this.cache = null;
    }

    provideCompletions(params) {
        let uri = params.textDocument.uri;
        let position = params.position;
        position.character--;
        let document = this.coder.document(uri);
        let ref = utils.symbolAtPosition(position, document, { backward: true });
        if (ref === undefined) {
            return undefined;
        }

        let items = engine.completionProvider(new engine.CompletionContext(ref.name, ref.range, uri));
        let completionItems = [];
        items.forEach((item, index) => {
            if (is.luaFunction(item.type)) {
                this._completeFunction(item, index, completionItems);
                return;
            } else {
                let symbol = langserver.CompletionItem.create(item.name);
                symbol.kind = utils.mapToCompletionKind(item.kind);
                symbol.data = { index: index };
                completionItems.push(symbol);
            }
        });

        this.cache = items;

        return completionItems.length === 0 ? null : completionItems;

    }

    resolveCompletion(item) {
        let data = this.cache[item.data.index];
        const override = item.data.override;
        item.detail = utils.symbolSignature(data, override);
        const description = data.type.description || '';
        const link = data.type.link;
        const desc = (override !== undefined) ? data.type.variants[override].description : description;
        item.documentation = {
            kind: langserver.MarkupKind.Markdown,
            value: desc + (link ? `  \r\n[more...](${link})` : '')
        };
        utils.functionSnippet(item, data, override);
        return item;
    }

    _completeFunction(item, index, list) {
        if (item.type.variants) {
            const type = item.type;
            type.variants.forEach((variant, override) => {
                let symbol = langserver.CompletionItem.create(item.name);
                symbol.kind = utils.mapToCompletionKind(item.kind);
                symbol.data = { index, override };
                list.push(symbol);
            });
        } else {
            let symbol = langserver.CompletionItem.create(item.name);
            symbol.kind = utils.mapToCompletionKind(item.kind);
            symbol.data = { index };
            list.push(symbol);
        }
    }
};

exports.CompletionProvider = CompletionProvider;

