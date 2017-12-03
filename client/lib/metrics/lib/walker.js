'use strict';

/**
 * This module is copy and modified from escompex-ast-moz for lua language
 */
const check = require('check-types');
const syntax = require('../syntax');

exports.walk = walk;

function walk(tree, settings, callbacks) {
    let syntaxes = syntax.get(settings);

    visitNodes(tree.body);

    function visitNodes(nodes, assignedName) {
        nodes.forEach(function (node) {
            visitNode(node, assignedName);
        });
    }

    function visitNode(node, assignedName) {
        var syntax;

        if (check.object(node)) {
            syntax = syntaxes[node.type];

            if (check.object(syntax)) {
                callbacks.processNode(node, syntax);

                if (syntax.newScope) {
                    syntax.newScope(node, syntax, callbacks.createScope);
                }

                visitChildren(node);

                if (syntax.newScope) {
                    callbacks.popScope();
                }
            }
        }
    }

    function visitChildren(node) {
        var syntax = syntaxes[node.type];

        if (check.array(syntax.children)) {
            syntax.children.forEach(function (child) {
                visitChild(
                    node[child],
                    check.function(syntax.assignableName) ? syntax.assignableName(node) : ''
                );
            });
        }
    }

    function visitChild(child, assignedName) {
        var visitor = check.array(child) ? visitNodes : visitNode;
        visitor(child, assignedName);
    }
}

