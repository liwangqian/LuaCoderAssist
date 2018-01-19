'use strict';

const message_1 = require('./lib/message');
const utils_1 = require('./lib/utils');
const traits_1 = require('../lib/symbol/symbol-traits');
const symbol_manager = require('./lib/symbol-manager');

class LDocProvider {
    constructor(coder) {
        this.coder = coder;
    }

    provideFunctionDoc(params) {
        let position = params.position;
        let uri = params.uri;

        let doc = this.coder.document(uri);
        if (!doc) {
            return message_1.error('null document.', -1);
        }

        let ref = utils_1.symbolAtPosition(position, doc, { backward: true, forward: true });
        if (ref === undefined) {
            return message_1.info('no symbol found at the cursor psotion.', 0);
        }

        let defs = this._findDefInCurrentModule(uri, ref).filter(d => {
            return d.location.start.line === position.line && d.kind === traits_1.SymbolKind.function;
        });

        let def = defs[0];

        if (!def) {
            return message_1.info('not function definition.', 0);
        }

        let docString =
            '--- ${1:function sum description.}\n' +
            '-- ${2:Some description, can be over several lines.}\n';

        let tabIndex = 2;
        def.params.forEach(p => {
            tabIndex += 1;
            docString += `-- @param ${p} \${${tabIndex}:description}\n`;
        });

        docString += `-- @return \${${tabIndex + 1}:value description.}\n`;

        let settings = this.coder.settings.ldoc;
        if (settings.authorInFunctionLevel) {
            docString += `-- @author ${settings.authorName}\n`;
        }

        return {
            uri: uri,
            location: { line: position.line, character: 0 },
            doc: docString
        };
    }

    onRequest(params) {
        return this.provideFunctionDoc(params);
    }

    _findDefInCurrentModule(uri, ref) {
        let sm = symbol_manager.instance();
        let docsym = sm.documentSymbol(uri);
        if (!docsym) {
            return [];
        }

        return utils_1.filterModDefinitions(docsym.definitions(), ref, utils_1.preciseCompareName);
    }
};

exports.LDocProvider = LDocProvider;
