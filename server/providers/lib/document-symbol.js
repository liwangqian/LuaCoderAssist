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

    definitions() {
        if (this.document.definitions) {
            return this.document.definitions;
        }

        return [];
    }

    references() {
        if (this.document.references) {
            return this.document.references;
        }

        return [];
    }

    dependences() {
        if (this.document.dependences) {
            return this.document.dependences;
        }

        return [];
    }

    findDefinitions(symbol) {
        return utils.findSymbol(symbol, this.definitions());
    }

    findReferences(symbol) {
        return utils.findSymbol(symbol, this.references());
    }
};

exports.DocumentSymbol = DocumentSymbol;