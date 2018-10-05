'use strict';

const protocols = require('../lib/protocols');
const languageClient = require('vscode-languageclient');
const vscode = require('vscode');

class Busted {
    constructor() { }

    /**
     * @param {languageClient.LanguageClient} connection
     */
    init(context, connection) {
        if (this.connection) {
            return;
        }
        this.connection = connection;
        context.subscriptions.push(
            vscode.commands.registerCommand(commands.ACTIVATE, () => {
                this.activate();
            })
        );

        context.subscriptions.push(
            vscode.commands.registerCommand(commands.DEACTIVATE, () => {
                this.deactivate();
            })
        );

        this.bustedButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 2);
        this.populateButton(false);
        this.bustedButton.show();
    }

    activate() {
        this.connection.sendRequest(protocols.BustedRequest.type, true)
            .then(this.onRequestSuccess.bind(this, true), this.onRequestFailure.bind(this, true));
    }

    deactivate() {
        this.connection.sendRequest(protocols.BustedRequest.type, false)
            .then(this.onRequestSuccess.bind(this, false), this.onRequestFailure.bind(this, false));
    }

    onRequestSuccess(activate) {
        console.log("request busted success, activate:" + activate);
        this.populateButton(activate);
    }

    onRequestFailure(activate) {
        console.log("request busted failure, activate:" + activate);
    }

    populateButton(activate) {
        Object.assign(this.bustedButton, activate ? ui.BT_ACTIVATE : ui.BT_DEACTIVATE);
    }
}

let _instance = undefined;

/**
 * @returns {Busted}
 */
function instance() {
    if (_instance) {
        return _instance;
    }

    _instance = new Busted();
    return _instance;
}
exports.instance = instance;

const commands = {
    ACTIVATE: "LuaCoderAssist.busted.activate",
    DEACTIVATE: "LuaCoderAssist.busted.deactivate"
}

const ui = {
    BT_ACTIVATE: {
        text: 'Busted $(circle-slash)',
        tooltip: 'Deactivate busted mode',
        command: commands.DEACTIVATE,
    },
    BT_DEACTIVATE: {
        text: 'Busted $(octoface)',
        tooltip: 'Activate busted mode',
        command: commands.ACTIVATE,
    },
}