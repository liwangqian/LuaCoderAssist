'use strict';
const _ = require('underscore');
const fs = require('fs');
const engine = require('../server/lib/engine');

class Logger {
    constructor() { }
    error(msg) {
        console.log(msg);
    }

    warn(msg) {
        console.log(msg);
    }
};

//tester
fs.readFile('./test/textures/test01.lua', (err, data) => {
    let uri = './textures/test01.lua';
    engine.parseDocument(data, uri, new Logger());
    console.log(engine.typeOf(engine.definitionProvider(new engine.DefinitionContext('D', [123, 125], uri))));
    const completionItems = engine.completionProvider(new engine.CompletionContext('Data.', [185, 186], uri));
    console.log(completionItems);
    console.log(completionItems[0]);
});
