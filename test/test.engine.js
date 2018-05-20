'use strict';

const fs = require('fs');
const engine = require('../server/lib/engine');

//tester
fs.readFile('./test/textures/test01.lua', (err, data) => {
    engine.analysis(data, './textures/test01.lua');
    console.log(engine.globals);
    console.log(engine.globals.get('test01'));
    console.log(engine.typeOf(engine.globals.get('test01').type.scope.symbols['x']));
});