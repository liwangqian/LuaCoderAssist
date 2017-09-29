"use strict";

const _ = require("lodash");

class Walker {
    constructor(types, logger) {
        this.types      = types;
        this.logger     = _.isFunction(logger) ? logger: () => {};
        this.parentNode = undefined;
        this.document   = {
            uri: undefined,
            symbols: []
        };
    }

    walkNode(node, container, scope, parentNode) {
        const parse = this.types[node.type];
        if (_.isFunction(parse)) {
            parse(this, node, container, scope, parentNode);
        } else {
            this.logger("[INFO] No parser for type: " + node.type);
        }
    }

    walkNodes(nodes, container, scope, parentNode) {
        if (_.isArray(nodes)) {
            nodes.forEach(node => {
                this.walkNode(node, container, scope, parentNode);
            });
        } else if (_.isObject(nodes)) {
            this.walkNode(nodes, container, scope, parentNode);
        }
    }

    reset() {
        this.parentNode = undefined;
        this.document   = {
            uri: undefined,
            symbols: []
        };
    }

    attachDocument(uri) {
        this.reset();
        this.document.uri = uri;
    }

    result() {
        return this.document;
    }

    addSymbol(symbol) {
        symbol.uri = this.document.uri;
        this.document.symbols.push(symbol);
    }
};

exports.Walker = Walker;