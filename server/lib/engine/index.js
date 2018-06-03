'use strict';

const { typeOf } = require('./typeof');
const { parseDocument } = require('./analysis');
const { CompleteContext, completionProvider } = require('./complete');
const { DefinitionContext, definitionProvider } = require('./definition');

module.exports = {
    typeOf, parseDocument, CompleteContext, completionProvider, DefinitionContext, definitionProvider
};