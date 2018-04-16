'use strict';

const { globalEnv } = require('./luaenv');
const { typeOf } = require('./typeof');
const { analysis, searchSymbol } = require('./analysis');
const _G = globalEnv();

exports.analysis = _analysis;
exports.query = _query;
exports.complete = _complete;
exports.globals = _G;

function _analysis(code, uri) {
    let res = analysis(code, uri);
    _G.setSymbol(res.type.fileName, res);
    _G.getSymbol('package').type.getField('loaded').type.setField(res.name, res.type.fileName);
}

function _query(name, loc, fileName) {
    const res = searchSymbol({ name, loc }, fileName);
    return typeOf(res);
}

function _complete(baseName, loc, fileName) {

}