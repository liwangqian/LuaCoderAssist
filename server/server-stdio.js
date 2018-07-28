'use strict';
var server_1 = require('./server');
var langserver_1 = require('vscode-languageserver');

var connection = langserver_1.createConnection(process.stdin, process.stdout);

console.log = connection.console.log.bind(connection.console);
console.error = connection.console.error.bind(connection.console);

server_1.server(connection);

process.stdin.on('close', () => {
    process.exit(0);
});
