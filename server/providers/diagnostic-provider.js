'use strict';

const execFile  = require('child_process').execFile;
const linters_1 = require('./lib/linters');

class DiagnosticProvider {
    constructor(coder) {
        this.coder      = coder;
        this.linters    = [];
        this._lintQueue = {};

        this._initLinters();
    }

    provideDiagnostics(uri) {
        if (this._lintQueue[uri]) {
            // has pending linter task, so just return.
            return;
        }

        this._lintQueue[uri] = true;

        // fire after a while wait for more input, performance consideration
        this._lintTask(uri);
        // setTimeout((uri) => {
        //     this._lintTask(uri);
        // }, 1000, uri);
    }

    _initLinters() {
        this.linters.push(new linters_1.Luacheck(this.coder));
    }

    _lintTask(uri) {
        this._lintQueue[uri] = undefined;
        const document = this.coder.document(uri);
        const text = document.getText();
        this.linters.forEach(linter => {
            // linters pre-condition check
            if (linter.precondiction && !linter.precondiction(document)) {
                return;
            }

            const command = linter.command(document);

            this._lint(command, text.toString('utf8')).then(ok => {}, nok => {
                const diagnostics = linter.parseDiagnostics(nok);
                this.coder.sendDiagnostics(uri, diagnostics);
            });
        }, this);
    }

    _lint(linter, input) {
        return new Promise((resolve, reject) => {
            let proc = execFile(linter.cmd, linter.args, {cwd: linter.cwd}, (error, stdout, stderr) => {
                if (error != null) {
                    reject({error: error, stdout: stdout, stderr: stderr});
                } else {
                    resolve({error: error, stdout: stdout, stderr: stderr});
                }
            });

            proc.stdin.end(input);
        });
    }
}

exports.DiagnosticProvider = DiagnosticProvider;