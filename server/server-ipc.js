'use strict';
var server_1 = require('./server');
var langserver_1 = require('vscode-languageserver');

var connection = langserver_1.createConnection(
  new langserver_1.IPCMessageReader(process), new langserver_1.IPCMessageWriter(process));
server_1.server(connection);
