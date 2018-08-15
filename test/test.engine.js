'use strict';
const _ = require('underscore');
const fs = require('fs');
const engine = require('../server/lib/engine');

class Logger {
    constructor() { }
    error(msg) {
        console.log('error: ' + msg);
    }

    warn(msg) {
        console.log('warn:' + msg);
    }
};

//tester
fs.readFile('./test/textures/test01.lua', (err, data) => {
    let uri = './textures/test01.lua';
    engine.parseDocument(data, uri, new Logger());
    let x = engine.typeOf(engine.definitionProvider(new engine.DefinitionContext('CPubClass', [591, 604], uri))[0]);
    console.log(x);
    console.log(x.get('name'));
    console.log(x.get('new'));

    console.log(engine.completionProvider(new engine.CompletionContext('CPubClass.', [591, 604], uri)));
    console.log(engine.completionProvider(new engine.CompletionContext('CPubClass.base:', [591, 604], uri)))

    let xy = engine.typeOf(engine.definitionProvider(new engine.DefinitionContext('xy', [384, 385], uri))[0]);
    console.log(xy);
    let xz = engine.typeOf(engine.definitionProvider(new engine.DefinitionContext('xy', [999, 1000], uri))[0]);
    console.log(xz);

    let n1 = engine.typeOf(engine.definitionProvider(new engine.DefinitionContext('n1', [999, 1001], uri))[0]);
    let n2 = engine.typeOf(engine.definitionProvider(new engine.DefinitionContext('n2', [999, 1001], uri))[0]);
    console.log(n1);
    console.log(n2);

    let nb = engine.typeOf(engine.definitionProvider(new engine.DefinitionContext('nb', [999, 1001], uri))[0]);
    console.log(nb);
});
