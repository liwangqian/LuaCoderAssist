/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';
var coder_1 = require('./coder');
var protocols_1 = require('./protocols');
var langserver_1 = require('vscode-languageserver');

function server(connection) {
    var documents = new langserver_1.TextDocuments();
    var coder = coder_1.instance();

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
                renameProvider: true,
                documentFormattingProvider: true,
                documentRangeFormattingProvider: true,
                // documentOnTypeFormattingProvider: {
                //     firstTriggerCharacter: ";"
                // }
                // codeActionProvider: true
            }
        };
    });

    documents.onDidChangeContent((change) => {
        coder.onDidChangeContent(change);
    });

    documents.onWillSaveWaitUntil((params) => {
        coder.onWillSaveWaitUntil(params);
    });

    documents.onDidSave((params) => {
        coder.onDidSave(params);
    });

    connection.onDidChangeConfiguration((change) => {
        coder.onDidChangeConfiguration(change);
    });

    connection.onDidChangeWatchedFiles((change) => {
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

    connection.onRenameRequest(params => {
        return coder.provideRename(params);
    });

    connection.onDocumentFormatting(params => {
        return coder.formatDocument(params);
    });

    connection.onDocumentRangeFormatting(params => {
        return coder.formatDocument(params);
    });

    connection.onDocumentOnTypeFormatting(params => {
        coder.tracer.info('onDocumentOnTypeFormatting');
        return coder.formatOnTyping(params);
    });

    connection.onRequest(protocols_1.LDocRequest.type, (params) => {
        let result = coder.onLDocRequest(params);
        connection.sendRequest(protocols_1.LDocRequest.type, result).then(undefined, e => {
            coder.tracer.info("send response to ldoc request failed: " + JSON.stringify(e));
        });
    });

    connection.onRequest(protocols_1.BustedRequest.type, (params) => {
        return coder.onBustedRequest(params);
    });

    connection.onCodeAction((params) => {
        return undefined;
    });

    connection.onExit(() => {
    });

    documents.onDidClose(event => {
        return coder.onDidClosed(event.document);
    });

    documents.listen(connection);
    // Listen on the connection
    connection.listen();
}

exports.server = server;
