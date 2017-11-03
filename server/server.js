/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';
var langserver_1 = require('vscode-languageserver');
var coder_1      = require('./Coder');

var connection   = langserver_1.createConnection(new langserver_1.IPCMessageReader(process),
                                                 new langserver_1.IPCMessageWriter(process));
var documents    = new langserver_1.TextDocuments();
var coder        = coder_1.instance();

connection.onInitialize((params) => {
    var ok = coder.init({
        workspaceRoot: params.rootPath, 
        connection: connection, 
        documents: documents
    });

    connection.console.info('extension initialize status: ' + ok);

    return {
        capabilities: {
            // Tell the client that the server works in FULL text document sync mode
            textDocumentSync: documents.syncKind,
            // Tell the client that the server support code complete
            documentSymbolProvider: true,
            definitionProvider: true,
            completionProvider: {
                resolveProvider: true,
                triggerCharacters: [".", ":"]
            },
            hoverProvider: true,
            signatureHelpProvider: {
                triggerCharacters: [',', '(']
            },
            // codeActionProvider: true
        }
    };
});

documents.onDidChangeContent((change) => {
    coder.onDidChangeContent(change);
});

documents.onDidSave((params) => {
    coder.onDidSave(params);
});

connection.onDidChangeConfiguration((change) => {
    coder.onDidChangeConfiguration(change);
});

connection.onDidChangeWatchedFiles((change) => {
    connection.console.info(JSON.stringify(change.changes));
    coder.onDidChangeWatchedFiles(change);
});

connection.onDocumentSymbol((params) => {
    return coder.provideDocumentSymbols(params);
});

connection.onDefinition((params) => {
    return coder.provideDefinitions(params);
});

connection.onCompletion((params) => {
    return coder.provideCompletions(params);
});

connection.onCompletionResolve((item) => {
    return coder.resolveCompletion(item);
});

connection.onHover((params) => {
    return coder.provideHover(params);
});

connection.onSignatureHelp((params) => {
    return coder.provideSignatureHelp(params);
})

connection.onCodeAction((params) => {
    return undefined;
});

documents.listen(connection);
// Listen on the connection
connection.listen();
//# sourceMappingURL=server.js.map