'use strict';

const engine = require('./engine');

const BUSTED_PRELOAD = 'stdlibs/busted.json';

let _std_assert = undefined;
let _busted_mode = false;

function enterBustedMode(extensionPath) {
    _std_assert = engine._G.get('assert');
    engine._G.set('assert', undefined, true);
    const busted = engine.LoadedPackages['busted'];
    if (busted) {
        busted.state.valid = true;
        Object.assign(engine._G.type._fields, busted.type._fields);
    } else {
        engine.loadExtentLib(extensionPath + BUSTED_PRELOAD, "busted");
    }
    _busted_mode = true;
}

exports.enterBustedMode = enterBustedMode;

function exitBustedMode() {
    if (!_busted_mode) {
        return;
    }
    const busted = engine.LoadedPackages['busted'];
    busted.state.valid = false;
    clearInvalidSymbols();
    engine._G.set('assert', _std_assert, true);
}

function clearInvalidSymbols() {
    let globals = engine._G.type.fields;
    for (const name in globals) {
        if (!globals[name].valid) {
            delete globals[name];
        }
    }
}

exports.exitBustedMode = exitBustedMode;
