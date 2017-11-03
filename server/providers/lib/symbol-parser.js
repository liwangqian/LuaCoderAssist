'use strict';

var walker_1     = require('../../lib/symbol/walker');
var types_1      = require('../../lib/symbol/types');
var docsymbol_1 = require('./document-symbol');
var luaparse_1   = require('luaparse');

const defaultOptions = {
    locations: true,
    scope: true,
    comments: false,
    luaversion: 5.1,
    allowDefined: true
}

class SymbolParser {
    constructor(coder) {
        this.coder = coder;
        this.options = defaultOptions;
    }

    updateOptions(settings) {
        this.options.allowDefined = settings.allowDefined;
        this.options.luaversion   = settings.luaversion;
    }

    parse(uri, content, maxLine) {
        if (!content) {
            return Promise.reject({message: 'null content'});
        }

        return new Promise((resolve, reject) => {
            let docSymbol = new docsymbol_1.DocumentSymbol(uri);
            let ast       = luaparse_1.parse(content.toString('utf8'), this.options);
            let walker    = new walker_1.Walker(types_1.get({}), this.options);

            // fix for completion at end of file
            ast.loc.end.line = maxLine + 1;
            try {
                docSymbol.document = walker.processDocument(uri, ast);
            } catch (error) {
                reject(error);
            }

            resolve(docSymbol);
        });
    }
}

exports.SymbolParser = SymbolParser;