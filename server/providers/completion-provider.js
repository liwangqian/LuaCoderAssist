'use strict';

const langserver = require('vscode-languageserver');
const utils = require('./lib/utils');
const engine = require('../lib/engine');
const is = require('../lib/engine/is');
const awaiter = require('./lib/awaiter');
const fileManager = require('./lib/file-manager');
const path = require('path')

class CompletionProvider {
    constructor(coder) {
        this.coder = coder;
        this.cache = null;
    }

    provideCompletions(params) {
        return awaiter.await(this, void 0, void 0, function* () {
            let uri = params.textDocument.uri;
            let position = params.position;
            position.character--;
            let document = yield this.coder.document(uri);
            let ref = utils.symbolAtPosition(position, document, { backward: true });
            if (ref === undefined) {
                return undefined;
            }

            if (ref.completePath) {
                return this._completePath(ref);
            }

            let ctx = new engine.CompletionContext(ref.name, ref.range, uri);
            ctx.isString = ref.isString;
            let items = engine.completionProvider(ctx);
            let completionItems = [];
            items.forEach((item, index) => {
                if (is.luaFunction(item.type)) {
                    this._completeFunction(item, index, completionItems, !ctx.functionOnly);
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
        });
    }

    resolveCompletion(item) {
        if (!item.data) {
            return item;
        }
    
        let data = this.cache[item.data.index];
        const override = item.data.override;
        const selfAsParam = item.data.selfAsParam;
        item.detail = utils.symbolSignature(data, override);
        const description = data.type.description || '';
        const link = data.type.link;
        const desc = (override !== undefined) ? data.type.variants[override].description : description;
        item.documentation = {
            kind: langserver.MarkupKind.Markdown,
            value: desc + (link ? `  \r\n[more...](${link})` : '')
        };
        utils.functionSnippet(item, data, override, selfAsParam);
        return item;
    }

    _completeFunction(item, index, list, selfAsParam) {
        if (item.type.variants) {
            const type = item.type;
            type.variants.forEach((variant, override) => {
                let symbol = langserver.CompletionItem.create(item.name);
                symbol.kind = utils.mapToCompletionKind(item.kind);
                symbol.data = { index, override, selfAsParam };
                list.push(symbol);
            });
        } else {
            let symbol = langserver.CompletionItem.create(item.name);
            symbol.kind = utils.mapToCompletionKind(item.kind);
            symbol.data = { index, selfAsParam };
            list.push(symbol);
        }
    }

    _completePath(ref) {
        const fmInstance = fileManager.instance();
        let refPath = ref.name.replace(/\./g, path.sep);
        let matchedFiles = fmInstance.matchPath(refPath);
        let pathList = [];
        if (path.sep == '\\') {
            refPath = refPath.replace(/\\/g, '\\\\');
        }
        const subDirNameReg = RegExp(refPath + `([^\./\\\\]+)`);
        let existSubDir = {};
        matchedFiles.forEach(file => {
            let label;
            let detail;
            if (refPath === "") { //trigger by ' or "
                label = path.basename(file, '.lua');
                detail = file;
            } else {
                label = subDirName(file, subDirNameReg);
                if (!label) {
                    return;
                }
                if (existSubDir[label]) {
                    return;
                } else {
                    existSubDir[label] = true;
                    detail = ref.name + label;
                }
            }

            let item = langserver.CompletionItem.create(label);
            item.kind = langserver.CompletionItemKind.Module;
            item.detail = detail;
            pathList.push(item);
        });
        return pathList;
    }
};

function subDirName(filePath, regExp) {
    let matches = filePath.match(regExp);
    return matches && matches[1];
}

exports.CompletionProvider = CompletionProvider;

