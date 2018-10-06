'use strict';

const execFile = require('child_process').execFile;
const linters_1 = require('./lib/linters');
const awaiter = require('./lib/awaiter');

class DiagnosticProvider {
    constructor(coder) {
        this.coder = coder;
        this.linters = [];
        this.lastTasks = {};

        this._initLinters();
    }

    provideDiagnostics(uri) {
        this._ensureTask(uri);
        this._updateTask(uri, this._newTimeoutTask(uri));
    }

    _updateTask(uri, newTimer) {
        let lastTimer = this.lastTasks[uri].timer;
        if (lastTimer) {
            /*定时器还没超时，则取消，重新起定时器*/
            clearTimeout(lastTimer);
        }
        this.lastTasks[uri].timer = newTimer;
    }

    _newTimeoutTask(uri) {
        return setTimeout((uri) => {
            this._lintTask(uri);
        }, 200, uri);
    }

    _initLinters() {
        this.linters.push(new linters_1.Luacheck(this.coder));
    }

    _lintTask(uri) {
        return awaiter.await(this, void 0, void 0, function* () {
            const lastTask = this.lastTasks[uri];
            lastTask.timer = undefined;

            const document = yield this.coder.document(uri);
            const version = document.version;
            if (version === lastTask.version) {
                /*没有新的修改*/
                return;
            }
            lastTask.version = version;
            const text = document.getText();
            this.linters.forEach((linter, idx) => {
                if (linter.precondiction && !linter.precondiction(document)) {
                    return;
                }

                const command = linter.command(document);
                this._run(uri, idx, command, text).then(() => { }, nok => {
                    const diagnostics = linter.parseDiagnostics(nok);
                    this.coder.sendDiagnostics(uri, diagnostics);
                });
            }, this);
        });
    }

    _ensureTask(uri) {
        if (!this.lastTasks[uri]) {
            this.lastTasks[uri] = {
                version: 0,
                timer: undefined,
                procs: []
            };
        }
    }

    _run(uri, idx, linter, input) {
        return new Promise((resolve, reject) => {
            /*如果上一次检查的进程未结束，则先杀掉老进程*/
            let procs = this.lastTasks[uri].procs;
            procs[idx] && procs[idx].kill();

            /*重新创建一个检查进程*/
            let proc = execFile(linter.cmd, linter.args, { cwd: linter.cwd }, (error, stdout, stderr) => {
                if (error != null) {
                    reject({ error: error, stdout: stdout, stderr: stderr });
                } else {
                    resolve({ error: error, stdout: stdout, stderr: stderr });
                }
            });

            procs[idx] = proc;
            proc.stdin.end(input);
        });
    }
}

exports.DiagnosticProvider = DiagnosticProvider;