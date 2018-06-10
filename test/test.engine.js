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
    let x = engine.typeOf(engine.definitionProvider(new engine.DefinitionContext('x', [208, 210], uri)));
    let y = engine.typeOf(engine.definitionProvider(new engine.DefinitionContext('y', [211, 213], uri)));
    let xx = engine.typeOf(engine.definitionProvider(new engine.DefinitionContext('xx', [233, 236], uri)));
    console.log(x);
    console.log(y);
    console.log(xx);
    // console.log(engine.typeOf(def.returns[1]));
    // const completionItems = engine.completionProvider(new engine.CompletionContext('x.', [138, 138], uri));
    // console.log(completionItems);
    // console.log(engine.typeOf(completionItems[0]));
});
