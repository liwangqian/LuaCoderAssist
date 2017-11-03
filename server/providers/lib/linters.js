'use strict';

const uri_1            = require('vscode-uri').default;
const langserver_1     = require('vscode-languageserver');
const path_1           = require('path');
const fs_1             = require('fs');
const symbol_manager_1 = require('./symbol-manager');

// default to 64-bit windows luacheck.exe, from https://github.com/mpeterv/luacheck/releases
const default_luacheck_executor = path_1.resolve(__dirname, '../../../3rd/luacheck/luacheck.exe');
const luacheck_regex = /^(.+):(\d+):(\d+)-(\d+): \(([EW])(\d+)\) (.+)$/;

class Luacheck {
    constructor(coder) {
        this.coder = coder;
    }

    command(document) {
        const settings = this.coder.settings.luacheck;
        let args = [];

        if (fs_1.exists(path_1.resolve(settings.configFilePath, ".luacheckrc"))) {
            args.push("--config", settings.configFilePath);
        }

        if (settings.std.length > 0) {
            args.push('--std', settings.std.join('+'));
        }

        if (settings.ignore.length > 0) {
            args.push("-i");
            args.push.apply(args, settings.ignore);
        }

        const defaultOpt = ['-m', '-t', '--no-self', '--no-color', '--codes', '--ranges', '--formatter', 'plain'];
        args.push.apply(args, defaultOpt);

        const jobs = settings.jobs;
        if (jobs > 1) {
            args.push('-j', jobs);
        }

        let smi = symbol_manager_1.instance();
        let globals = smi.documentSymbol(document.uri).dependences().map((dep) => {
            return dep.name;
        });

        if (globals.length > 0) {
            args.push('--read-globals');
            args.push.apply(args, globals);
        }

        const fileName = uri_1.parse(document.uri).fsPath;
        args.push("--filename", fileName, "-"); //use stdin

        let cmd = settings.execPath || default_luacheck_executor;

        return {
            cmd: cmd,
            cwd: path_1.dirname(fileName), 
            args: args
        };
    }

    parseDiagnostics(data) {
        let diagnostics = [];
        
        if (data.error != null && data.error.message === 'stdout maxBuffer exceeded.') {
            return diagnostics;
        }

        let maxProblems = this.coder.settings.luacheck.maxProblems;

        //luacheck output to stdout channal
        const lines = data.stdout.split(/\r\n|\r|\n/);
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            if (diagnostics.length > maxProblems) {
                break;
            }

            let matched = luacheck_regex.exec(line);
            if (!matched) {
                continue;
            }

            let lineNo   = parseInt(matched[2]);
            let schar    = parseInt(matched[3]);
            let echar    = parseInt(matched[4]);
            let eType    = this._toDiagnosticSeverity(matched[5]);
            let eCode    = parseInt(matched[6])
            let errMsg   = matched[7];

            diagnostics.push(langserver_1.Diagnostic.create(
                langserver_1.Range.create(lineNo - 1, schar - 1, lineNo - 1, echar),
                errMsg, eType, eCode, "luacheck"
            ));
        }

        return diagnostics;
    }

    precondiction(document) {
        return this._sizeCheck(document);
    }

    _sizeCheck(document) {
        const text = document.getText();
        const maxSize = this.coder.settings.luacheck.fileSizeLimit * 1024;
        if (text.length > maxSize) {
            this.coder.sendDiagnostics(document.uri, [this._lengthOverWarning(document.positionAt(maxSize))])
            return false;
        }

        return true;
    }

    _toDiagnosticSeverity(errCode) {
        switch (errCode) {
            case "E": return langserver_1.DiagnosticSeverity.Error;
            case "W": return langserver_1.DiagnosticSeverity.Warning;
            default : return langserver_1.DiagnosticSeverity.Information;
        }
    }

    _lengthOverWarning(position) {
        return langserver_1.Diagnostic.create(
            langserver_1.Range.create(position, position),
            'File size is over the config file size limit.', 
            langserver_1.DiagnosticSeverity.Hint, undefined,
            'luacheck');
    }
};

exports.Luacheck = Luacheck;