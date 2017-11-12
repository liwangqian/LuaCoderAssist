'use strict';

const vscode_1 = require('vscode');

class Logger {
    static configure() {
        this.output = vscode_1.window.createOutputChannel("LuaCoderAssistClient");
    }

    static log(message, ...params) {
        if (this.output !== undefined) {
            this.output.appendLine([message, ...params].join(' '));
        }
    }

    static error(message, ...params) {
        if (this.output !== undefined) {
            this.output.appendLine(["[ERROR]", message, ...params].join(' '));
        }
    }

    static warn(message, ...params) {
        if (this.output !== undefined) {
            this.output.appendLine(["[WARN]", message, ...params].join(' '));
        }
    }
}

exports.Logger = Logger;
