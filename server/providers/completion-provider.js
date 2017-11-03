'use strict';

const langserver     = require('vscode-languageserver');
const symbol_manager = require('./lib/symbol-manager');
const utils          = require('./lib/utils');
const uri_1          = require('vscode-uri').default;

class CompletionProvider {
    constructor(coder) {
        this.coder = coder;
    }

    provideCompletions(params) {
        let position = params.position;
        if (position.character == 0) {
            return undefined;
        }

        let uri = params.textDocument.uri;
        let document = this.coder.document(uri);
        let ref = utils.symbolAtPosition(position, document, {backward: true});
        if (ref === undefined) {
            return undefined;
        }

        let completionList = undefined;

        // find in current module
        let defs = this._findDefInCurrentModule(uri, ref);
        if (defs) {
            completionList = defs.map(d => {
                let item = langserver.CompletionItem.create(d.name);
                item.kind = utils.mapToCompletionKind(d.kind);
                item.data = d;
                return item;
            });
        }

        // find in dependence
        let deps = this._findDefInDependence(uri, ref);
        if (deps) {
            completionList = (completionList || []).concat(deps.map(d => {
                let item = langserver.CompletionItem.create(d.name);
                item.kind = utils.mapToCompletionKind(d.kind);
                item.data = d;
                return item;
            }));
        }
        
        if (completionList && completionList.length > 0) {
            return completionList;
        } else {
            // fall in editor default completion
            return undefined;
        }
        
    }
    
    resolveCompletion(item) {
        let islocal = item.data.islocal
        let detail = (islocal ? '(local ' : '') + utils.symbolKindDesc(item.data.kind) + (islocal ? ') ' : ' ');
        detail = detail + (utils.functionSignature(item.data) || item.data.name);
        item.detail = detail;
        item.documentation = uri_1.parse(item.data.uri).fsPath;
        return item;
    }

    _findDefInCurrentModule(uri, ref) {
        let sm = symbol_manager.instance();
        let docsym = sm.documentSymbol(uri);
        if (!docsym) {
            return undefined;
        }

        let defs = docsym.definitions();
        defs = utils.filterModDefinitions(defs, ref, false);
        if (ref.bases[0] === undefined) {
            defs = (defs || []).concat(docsym.dependences());
        }

        return defs;
    }
    
    _findDefInDependence(uri, ref) {
        return utils.filterDepDefinitions(
            utils.getDefinitionsInDependences(uri, this.coder.tracer),
            ref, false);
    }

};

exports.CompletionProvider = CompletionProvider;

