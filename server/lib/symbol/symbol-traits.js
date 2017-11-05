'use strict';

function symbol(name, kind, islocal) {
    return {
        name: name,
        kind: kind,
        islocal: islocal,
        uri: undefined,
        location: undefined,
        scope: undefined,
        container: undefined,
        bases: [],
        alias: undefined,
        params: undefined,
        returnMode: undefined
    };
}

exports.symbol = symbol;

var SymbolKind = [];
SymbolKind[SymbolKind["variable"]   = 1] = "variable";
SymbolKind[SymbolKind["parameter"]  = 2] = "parameter";
SymbolKind[SymbolKind["reference"]  = 3] = "reference";
SymbolKind[SymbolKind["function"]   = 4] = "function";
SymbolKind[SymbolKind["class"]      = 5] = "class";
SymbolKind[SymbolKind["module"]     = 6] = "module";
SymbolKind[SymbolKind["dependence"] = 7] = "dependence";
SymbolKind[SymbolKind["property"]   = 8] = "property";
SymbolKind[SymbolKind["label"]      = 9] = "label";

exports.SymbolKind = SymbolKind;
