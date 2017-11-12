'use strict';

const protocols = require('../lib/protocols');
const utils = require('../lib/utils');
const logger = require('../lib/logger');
const vscode = require('vscode');

class LDocCommand {
    constructor(connection) {
        this.connection = connection;
        connection.onRequest(protocols.LDocRequest.type, (params) => {
            this.onResponse(params);
        });
    }

    onRequest() {
        let activeDoc = utils.getActiveLuaDocument();
        if (!activeDoc) {
            return;
        }

        let position = activeDoc.validatePosition(utils.getCursorPosition());
        let params = { uri: activeDoc.uri.toString(), position: position }
        this.connection.sendRequest(protocols.LDocRequest.type, params).then(undefined, (e) => {
            logger.Logger.error('onRequest for LDoc failed: ', e);
        });
    }

    onResponse(params) {
        if (params.message) {
            switch (params.type) {
                case 'error':
                    logger.Logger.error(params.message);
                    break;
                case 'warn':
                    logger.Logger.warn(params.message);
                    break;
                case 'info':
                    logger.Logger.log(params.message);
                default:
                    break;
            }
            return;
        }

        return insertDoc(params);
    }
};

function insertDoc(params) {
    let activeTextEditor = vscode.window.activeTextEditor;
    let snippet = new vscode.SnippetString(params.doc);
    let position = new vscode.Position(params.location.line, params.location.character);
    activeTextEditor.insertSnippet(snippet, position);
    return;
}

exports.LDocCommand = LDocCommand;
