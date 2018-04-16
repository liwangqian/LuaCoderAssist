'use strict';

const fs = require('fs');
const engine = require('../server/lib/engine');

//tester
fs.readFile('./test/textures/test01.lua', (err, data) => {
    engine.analysis(data, './textures/test01.lua');
    console.log(engine.globals);
    console.log(engine.globals.getSymbol('package'));
});