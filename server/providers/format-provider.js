'use strict';
const fmt = require('lua-fmt');
const langserver = require('vscode-languageserver');
const awaiter = require('./lib/awaiter');

class FormatProvider {
    constructor(coder) {
        this.coder = coder;
    }

    formatOnTyping(params) {
        let uri = params.textDocument.uri;
        let opt = this.coder.settings.format;

        let pos = params.position;
        let char = params.ch;

        // this.coder.tracer.info(JSON.stringify(params));

        return [];
    }

    formatRangeText(params) {
        return awaiter.await(this, void 0, void 0, function* () {
            let uri = params.textDocument.uri;
            let opt = this.coder.settings.format;

            if (!opt.enable) {
                return [];
            }

            let document = yield this.coder.document(uri);

            let text
            let range = params.range;

            text = document.getText();
            if (!range) {
                let endPos = document.positionAt(text.length);
                range = langserver.Range.create(0, 0, endPos.line, endPos.character);
            } else {
                text = text.substring(document.offsetAt(range.start), document.offsetAt(range.end));
            }

            try {
                let formattedText = fmt.formatText(text, this._formatOptions(opt));
                return [langserver.TextEdit.replace(range, formattedText)];
            } catch (err) {
                return [];
            }
        });
    }

    _formatOptions(userOptions) {
        return {
            lineWidth: userOptions.lineWidth || 120,
            indentCount: userOptions.indentCount || 4,
            quotemark: userOptions.quotemark || 'single'
        };
    }
};

exports.FormatProvider = FormatProvider;
