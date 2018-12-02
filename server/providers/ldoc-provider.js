'use strict';

const engine = require('../lib/engine');
const message_1 = require('./lib/message');
const utils_1 = require('./lib/utils');
const awaiter = require('./lib/awaiter');

class LDocProvider {
    constructor(coder) {
        this.coder = coder;
    }

    onRequest(params) {
        return this.provideFunctionDoc(params);
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
                .filter(symbol => {
                    return engine.is.luaFunction(symbol.type)
                        && symbol.location[0] == ref.range[0]
                        && symbol.location[1] == ref.range[1]
                });
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
                docString += `-- @tparam  \${${tabIndex++}:type} ${param.name} \${${tabIndex++}:description}\n`;
            });

            ftype.returns.forEach((ret) => {
                const retType = engine.typeOf(ret);
                docString += `-- @treturn ${retType.typeName} \${${tabIndex++}:description.}\n`;
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
};

exports.LDocProvider = LDocProvider;
