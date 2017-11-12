'use strict';

const vscode_1 = require('vscode');

function getActiveLuaDocument() {
    const activeTextEditor = vscode_1.window.activeTextEditor;
    if (activeTextEditor === undefined || activeTextEditor.document === undefined) {
        return null;
    }

    if (activeTextEditor.document.languageId != "lua") {
        return null;
    }

    return activeTextEditor.document;
}

exports.getActiveLuaDocument = getActiveLuaDocument;

function getCursorPosition() {
    const activeTextEditor = vscode_1.window.activeTextEditor;
    return activeTextEditor.selection.active;
}

exports.getCursorPosition = getCursorPosition;
