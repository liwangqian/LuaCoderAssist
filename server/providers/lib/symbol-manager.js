'use strict';

const langserver_1    = require('vscode-languageserver');
const symbol_parser_1 = require('./symbol-parser');
const file_manager_1  = require('./file-manager');
const path_1          = require('path');
const uri_1           = require('vscode-uri').default;

class SymbolManager {
    constructor() {
        this.documentSymbols = {};
        this.parser = undefined;
        this.coder = undefined;
    }

    init(coder) {
        this.coder = coder;
        this.parser = new symbol_parser_1.SymbolParser(coder);
    }

    updateOptions(settings) {
        this.parser.updateOptions(settings.luaparse);
    }

    documentSymbol(uri) {
        return this.documentSymbols[uri];
    }

    parseDocument(uri, content, maxLine) {
        return this.parser.parse(uri, content, maxLine).then((ds) => {
            this.documentSymbols[uri] = ds;
            this.coder.sendDiagnostics(uri, []);
            setTimeout(this.parseDependence.bind(this), 0, uri);
            // this.coder.tracer.info('parse: file parse ok');
        }, (err) => {
            this.coder.tracer.error(err.message);
            this.coder.sendDiagnostics(uri, flyCheckDiagnostic(err.message));
        });
    }

    parseDependence(uri) {
        let docSym = this.documentSymbols[uri];
        if (!docSym) {
            return;
        }
        let deps = docSym.dependences();
        deps.forEach(d => {
            this._parseOneDependence(d);
        }, this);
    }

    _parseOneDependence(d) {
        let files = file_manager_1.instance().getFiles(d.name);

        if (d.shortPath) {
            files = files.filter(file => {
                // we assume the file path is normalized.
                return file.includes(d.shortPath);
            });
        }

        files.forEach(file => {
            let uri = uri_1.file(file).toString();
            if (this.documentSymbols[uri]) {
                // this.coder.tracer.info('already parsed: ' + file);
                return;
            }
            // this.coder.tracer.info('go parse:' + file);
            let doc = this.coder.document(uri);
            this.parser.parse(uri, doc.getText(), doc.lineCount).then((ds) => {
                this.documentSymbols[uri] = ds;
            }, (err) => {
                this.coder.tracer.error(err.message);
            });
        }, this);
    }

};

var _symbol_manager_instance = undefined;
function instance() {
    if (_symbol_manager_instance == undefined) {
        _symbol_manager_instance = new SymbolManager();
    }

    return _symbol_manager_instance;
}

exports.instance = instance;

const diagnostic_regex = /\[(\d+):(\d+)\]\s+(.+)/;
function flyCheckDiagnostic(msg) {
    let infos = msg.match(diagnostic_regex);
    if (!infos) {
        return [];
    }
    let line    = parseInt(infos[1]);
    let colum   = parseInt(infos[2]);
    let message = infos[3];

    let diagnostics = [];
    diagnostics.push(langserver_1.Diagnostic.create(
        langserver_1.Range.create(line, colum, line, colum + 1),
        message, langserver_1.DiagnosticSeverity.Error,
        undefined, 'luaparse'
    ));

    return diagnostics;
}