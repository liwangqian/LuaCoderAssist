'use strict';

const engine = require('../lib/engine');
const message_1 = require('./lib/message');
const utils_1 = require('./lib/utils');
const awaiter = require('./lib/awaiter');

class LDocProvider {
    constructor(coder) {
        this.coder = coder;
    }

    provideFunctionDoc(params) {
        return awaiter.await(this, void 0, void 0, function* () {
            let position = params.position;
            let uri = params.uri;

            let doc = yield this.coder.document(uri);
            if (!doc) {
                return message_1.error('null document.', -1);
            }

            let ref = utils_1.symbolAtPosition(position, doc, { backward: true, forward: true });
            if (ref === undefined) {
                return message_1.info('no symbol found at the cursor psotion.', 0);
            }

            let funcs = engine.definitionProvider(new engine.DefinitionContext(ref.name, ref.range, uri))
                .filter(symbol => engine.is.luaFunction(symbol.type));
            let def = funcs[0];
            if (!def) {
                return message_1.info('not function definition.', 0);
            }

            let docString =
                '--- ${1:function summary description.}\n' +
                '-- ${2:function detail description.}\n';

            let ftype = def.type;
            let tabIndex = 3;
            ftype.args.forEach(param => {
                docString += `-- @param  ${param.name}<\${${tabIndex++}:type}> \${${tabIndex++}:description}\n`;
            });

            ftype.returns.forEach((ret, idx) => {
                const retType = engine.typeOf(ret);
                docString += `-- @return R${idx}<${retType.typeName}> \${${tabIndex++}:value description.}\n`;
            });

            let settings = this.coder.settings.ldoc;
            if (settings.authorInFunctionLevel) {
                docString += `-- @author ${settings.authorName}\n`;
            }

            return {
                uri: uri,
                location: { line: position.line, character: 0 },
                doc: docString
            };
        });
    }

    onRequest(params) {
        return this.provideFunctionDoc(params);
    }
};

exports.LDocProvider = LDocProvider;
