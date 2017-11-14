"use strict";

const _ = require("lodash");
const utils = require('./utils');

class Walker {
    constructor(types, options, logger) {
        this.types      = types;
        // Allow defining globals implicitly by setting them.
        this.options    = { allowDefined: options.allowDefined };
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

    walkNode(node, container, scope, parentSymbol, isDef) {
        const parse = this.types[node.type];
        if (_.isFunction(parse)) {
            parse(this, node, container, scope, parentSymbol, isDef);
        } else {
            this.logger("[INFO] No parser for type: " + node.type);
        }
    }

    walkNodes(nodes, container, scope, parentSymbol, isDef) {
        if (_.isArray(nodes)) {
            nodes.forEach(node => {
                this.walkNode(node, container, scope, parentSymbol, isDef);
            });
        } else if (_.isObject(nodes)) {
            this.walkNode(nodes, container, scope, parentSymbol, isDef);
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
        let matches = uri.match(/(\w+)(\.lua)?$/);
        if (matches) {
            let fileName = matches[1];
            this.walkNodes(ast.body, { name: '_G' }, utils.loc2Range(ast.loc), { name: fileName, bases: [] }, true);
        }

        return this.document;
    }

    addMod(mod) {
        this.document.module = mod;
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
        this.document.dependences.push(dep);
    }
};

exports.Walker = Walker;