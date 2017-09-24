'use strict';

var luaparse_1 = require('luaparse');
var fs_1       = require("fs");
var types_1    = require('../lib/types');
var walker_1   = require("../lib/walker");

var fileName = "F:\\lua\\test.lua";
fs_1.readFile(fileName, (err, data) => {
    var ast = luaparse_1.parse(data.toString('utf8'), {locations: true, scope: true});
    fs_1.writeFileSync("F:\\lua\\test.json", JSON.stringify(ast, null, 4));

    var walker = new walker_1.Walker(types_1.get({}), console.log);

    walker.attachDocument(fileName);
    walker.walkNodes(ast.body, 'unname', ast.loc, ast);

    console.log(JSON.stringify(walker.result(), null, 4));
});