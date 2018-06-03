'use strict';

const { typeOf } = require('./typeof');
const { parseDocument } = require('./analysis');
const { CompletionContext, completionProvider } = require('./completion');
const { DefinitionContext, definitionProvider } = require('./definition');

module.exports = {
    typeOf, parseDocument, CompletionContext, completionProvider, DefinitionContext, definitionProvider
};