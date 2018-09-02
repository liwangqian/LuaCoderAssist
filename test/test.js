'use strict';

const cp_1 = require('child_process');
const events_1 = require('events');

class Command {
    /**
     * @param {String} cmd The command to execute
     * @param {String[]} args The arguments of the command
     * @param {ExecFileOptions} options The options of the command, same of the options for child_process.execFile
     */
    constructor(cmd, args, options) {
        this.cmd = cmd;
        this.args = args || [];
        this.options = options;
    }
}

class CommandExecutor {
    constructor() {
        this._executor = cp_1.spawn("C:\\Program Files\\Git\\bin\\sh.exe");
        this._cwd = undefined;
        this._eventEmitter = new events_1.EventEmitter();
    }

    dispose() {
        this.kill();
    }

    kill(signal) {
        if (this._executor && !this._executor.killed) {
            this._eventEmitter = undefined;
            this._executor.kill(signal);
            this._ready = false;
        }
    }

    get ready() {
        return this._ready;
    }

    exec(cmd, cwd) {
        this._ensureExecutor(cwd);
        this._sendText(cmd);
        return new Promise((resolve, reject) => {
            const outputs = [];
            let start = false;
            this._executor.stdout.on('data', data => {
                const outStr = data.toString();
                console.log(outStr);
                if (!start && !outStr.includes(cmd)) {
                    return;
                }
                start = true;
                outputs.push(outStr);
            });
            this._executor.stderr.on('data', data => {
                reject(data.toString());
            });
            this._executor.stdout.once('end', () => {
                if (!start) {
                    return;
                }
                resolve(outputs.join('\n'));
            });
        });
    }

    _ensureExecutor(cwd) {
        if (this._executor === undefined) {
            this._eventEmitter = new events_1.EventEmitter();
            this._executor = cp_1.spawn('cmd.exe');
            this._sendText(`cd ${cwd}`);
            this._cwd = cwd;
        } else {
            if (this._cwd !== cwd) {
                this._sendText(`cd ${cwd}`);
                this._cwd = cwd;
            }
        }
    }

    _sendText(cmd) {
        this._executor.stdin.write(cmd);
    }
}

class CommandQueue {
    constructor() {
        this._penddingCommands = new Map();
        this._commands = [];
        this._executor = new CommandExecutor();

    }

    dispose() {
        this._executor.dispose();
    }

    /**
     * Execute a command asynchronize
     * @param {Command} command The command to execute
     * @returns {Promise}
     */
    exec(command) {
        const commandKey = `${command.cmd}-${command.args.join(',')}-${command.options ? JSON.stringify(command.options) : ''}`;
        if (this._penddingCommands.has(commandKey)) {
            return this._penddingCommands.get(commandKey);
        }

        this._penddingCommands = new Promise();
    }
}

const cexecutor = new CommandExecutor();
cexecutor.exec('dir', '.').then(data => {
    console.log(data);
});
cexecutor.exec('dir', '.').then(data => {
    console.log(data);
});