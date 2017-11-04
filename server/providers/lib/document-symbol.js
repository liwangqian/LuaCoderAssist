'use strict';

var utils  = require('../../lib/symbol/utils');

class DocumentSymbol {
    constructor(uri) {
        this.document = {
            uri: uri,
            module: undefined,
            definitions: undefined,
            references:  undefined,
            dependences: undefined,
            ast: undefined
        };
    }

    moduleName() {
        if (this.document.module) {
            return this.document.module.name;
        }

        return undefined;
    }

    isModule() {
        return !!this.document.module;
    }

    isReturnMode() {
        return !!this.document.returns;
    }

    definitions() {
        return this.document.definitions || [];
    }

    returns() {
        return this.document.returns || [];
    }

    references() {
        return this.document.references || [];
    }

    dependences() {
        return this.document.dependences || [];
    }

    findDefinitions(symbol) {
        return utils.findSymbol(symbol, this.definitions());
    }

    findReferences(symbol) {
        return utils.findSymbol(symbol, this.references());
    }
};

exports.DocumentSymbol = DocumentSymbol;