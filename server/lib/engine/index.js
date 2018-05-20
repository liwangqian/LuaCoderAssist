'use strict';

const { globalEnv } = require('./luaenv');
const { typeOf } = require('./typeof');
const { analysis, findDef } = require('./analysis');
const _G = globalEnv();

exports.typeOf = typeOf;
exports.analysis = _analysis;
exports.query = _query;
exports.complete = _complete;
exports.globals = _G;

let loaded = {};

function _analysis(code, uri) {
    let res = analysis(code, uri);
    _G.set(res.name, res);
    loaded[res.type.fileName] = res;
}

function _query(ref, loc, fileName) {
    const res = findDef(ref, fileName);
    return res;
}

function _complete(name, loc, fileName) {

}