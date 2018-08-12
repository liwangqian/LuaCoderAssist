'use strict';

const langserver = require('vscode-languageserver');
const utils = require('./lib/utils');
const engine = require('../lib/engine');

class CompletionProvider {
    constructor(coder) {
        this.coder = coder;
        this.cache = null;
    }

    provideCompletions(params) {
        let uri = params.textDocument.uri;
        let position = params.position;
        let document = this.coder.document(uri);
        let ref = utils.symbolAtPosition(position, document, { backward: true });
        if (ref === undefined) {
            return undefined;
        }

        let items = engine.completionProvider(new engine.CompletionContext(ref.name, ref.range, uri));
        let completionItems = items.map((item, index) => {
            let symbol = langserver.CompletionItem.create(item.name);
            symbol.kind = utils.mapToCompletionKind(engine.typeOf(item).name);
            symbol.data = { index: index };
            return symbol;
        });

        this.cache = items;

        return completionItems.length === 0 ? null : completionItems;

    }

    resolveCompletion(item) {
        // let islocal = item.data.islocal
        // let detail = (islocal ? '(local ' : '') + utils.symbolKindDesc(item.data.kind) + (islocal ? ') ' : ' ');
        // detail = detail + (utils.functionSignature(item.data) || item.data.name);
        // item.detail = detail;
        // item.documentation = uri_1.parse(item.data.uri).fsPath;
        let data = this.cache[item.data.index];
        let detail = [];
        detail.push(data.local ? 'local ' : '');
        utils.functionSignature(data, detail);
        item.detail = detail.join('');
        return item;
    }
};

exports.CompletionProvider = CompletionProvider;

