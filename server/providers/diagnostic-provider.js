'use strict';

const execFile = require('child_process').execFile;
const linters_1 = require('./lib/linters');
const awaiter = require('./lib/awaiter');

const MINIMUN_TIMEOUT = 500; // ms

class DiagnosticProvider {
    constructor(coder) {
        this.coder = coder;
        this.lastTasks = {};
        this._initLinters();
    }

    _initLinters() {
        this.linters = [];
        this.linters.push(new linters_1.Luacheck(this.coder));
    }

    provideDiagnostics(uri) {
        this._updateTask(uri);
    }

    _updateTask(uri) {
        let lastTask = this._ensureTask(uri);
        let timerId = lastTask.timerId;
        if (timerId) {
            /*定时器还没超时，则取消，重新起定时器*/
            clearTimeout(timerId);
        }
        lastTask.timerId = this._newTimeoutTask(uri, lastTask.timeout);
    }

    _ensureTask(uri) {
        let lastTask = this.lastTasks[uri];
        if (!lastTask) {
            lastTask = {
                version: 0,
                timeout: MINIMUN_TIMEOUT,
                timerId: undefined,
            };
            this.lastTasks[uri] = lastTask;
        }
        return lastTask;
    }

    _newTimeoutTask(uri, timeout) {
        return setTimeout((uri) => {
            this._lintTask(uri);
        }, timeout, uri);
    }

    _lintTask(uri) {
        return awaiter.await(this, void 0, void 0, function* () {
            const start = process.hrtime();
            let lastTask = this.lastTasks[uri];
            lastTask.timerId = undefined;

            const document = yield this.coder.document(uri);
            const version = document.version;
            if (version === lastTask.version) {
                /*没有新的修改*/
                return;
            }
            lastTask.version = version;
            const text = document.getText();
            const promises = [];
            let timeout = 0;
            this.linters.forEach(linter => {
                if (linter.precondiction && !linter.precondiction(document)) {
                    return;
                }

                const command = linter.command(document);
                let promise = this._run(command, text).then(() => {
                    this.coder.sendDiagnostics(uri, []);
                    timeout = Math.max(timeout, this._elapsedTime(start));
                }, nok => {
                    const diagnostics = linter.parseDiagnostics(nok);
                    this.coder.sendDiagnostics(uri, diagnostics);
                    timeout = Math.max(timeout, this._elapsedTime(start));
                });

                promises.push(promise);

            }, this);

            Promise.all(promises).then(() => {
                if (timeout > MINIMUN_TIMEOUT) {
                    lastTask.timeout = timeout;
                }
                this.coder.tracer.info(`luacheck check ${uri} in ${timeout} ms.`);
            });
        });
    }

    _run(linter, input) {
        return new Promise((resolve, reject) => {
            /*重新创建一个检查进程*/
            try {
                let proc = execFile(linter.cmd, linter.args, { cwd: linter.cwd }, (error, stdout, stderr) => {
                    if (error != null) {
                        reject({ error: error, stdout: stdout, stderr: stderr });
                    } else {
                        resolve({ error: error, stdout: stdout, stderr: stderr });
                    }
                });

                proc.stdin.end(input);
            } catch (e) {
                console.error(`execute '${linter.cmd} ${linter.args.join(' ')}' failed.`);
                console.error(e);
                reject({error: e});
            }
        });
    }

    _elapsedTime(start) {
        const duration = process.hrtime(start);
        const timeInMs = (duration[0] * 1000) + Math.floor(duration[1] / 1000000);
        return timeInMs;
    }
}

exports.DiagnosticProvider = DiagnosticProvider;