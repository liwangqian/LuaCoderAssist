'use strict';

const traits         = require('../lib/symbol/symbol-traits');
const symbol_manager = require('./lib/symbol-manager');
const utils          = require('./lib/utils');
const helper         = require('./lib/signature-helper');
const lang_sever     = require('vscode-languageserver');

class SignatureProvider {
    constructor(coder) {
        this.coder = coder;
    }

    provideSignatureHelp(params) {
        let logger = this.coder.tracer.info.bind(this.coder.tracer);
        let position = params.position;
        let uri = params.textDocument.uri;
        let document = this.coder.document(uri);
        let offset = document.offsetAt(position);

        let ctx = helper.signature_context(
            document.getText().toString('utf8'), 
            offset, 
            logger
        );

        if (ctx === undefined || ctx.ref === undefined) {
            return undefined;
        }
        
        // 将位置信息附上去，用于符号查找
        ctx.ref.location = {start: position, end: position};

        let defs = this._findDefInCurrentModule(uri, ctx.ref);

        // 如果是函数定义，就直接返回了
        if (defs && defs[0] && defs[0].location.start.line === position.line) {
            return undefined;
        }
        
        // 在依赖模块中查找定义
        defs = (defs || []).concat(this._findDefInDependence(uri, ctx.ref));

        let signatures = [];
        defs.forEach(d => {
            if (d.kind !== traits.SymbolKind.function) {
                return;
            }

            let param_infos = [];
            d.params.forEach(p => {
                param_infos.push(lang_sever.ParameterInformation.create(p));
            });

            let item = lang_sever.SignatureInformation.create(utils.functionSignature(d));
            item.parameters = param_infos;
            signatures.push(item);
        });

        return {
            signatures: signatures,
            activeSignature: signatures.length > 0 ? 0 : null,
            activeParameter: signatures.length > 0 ? ctx.ctx.param_id : null
        };
    }

    _findDefInCurrentModule(uri, ref) {
        let sm = symbol_manager.instance();
        let docsym = sm.documentSymbol(uri);
        if (!docsym) {
            return undefined;
        }

        return utils.filterModDefinitions(docsym.definitions(), ref, true);
    }

    _findDefInDependence(uri, ref) {
        return utils.filterDepDefinitions(
            utils.getDefinitionsInDependences(uri, ref, this.coder.tracer),
            ref, true);
    }
};

exports.SignatureProvider = SignatureProvider;