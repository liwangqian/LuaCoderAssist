"use strict";

var _ = require("lodash");
var utils = require('./utils');

class Walker {
    constructor(types, logger) {
        this.types      = types;
        this.logger     = _.isFunction(logger) ? logger: () => {};
        this.document   = {
            uri: undefined,
            module: undefined,
            definitions: [],
            references: [],
            dependences: [],
            ast: undefined
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
        this.document   = {
            uri: undefined,
            module: undefined,
            definitions: [],
            references: [],
            dependences: [],
            ast: undefined
        };
    }

    processDocument(uri, ast) {
        this.reset();
        this.document.uri = uri;
        this.document.ast = ast;

        this.walkNodes(ast.body, {name: '_G'}, utils.loc2Range(ast.loc), ast);

        return this.document;
    }

    addDef(def) {
        def.uri = this.document.uri;
        this.document.definitions.push(def);
    }

    addRef(ref) {
        ref.uri = this.document.uri;
        this.document.references.push(ref);
    }

    addDep(dep) {
        dep.uri = this.document.uri;
        this.document.dependences.push(dep);
    }
};

exports.Walker = Walker;