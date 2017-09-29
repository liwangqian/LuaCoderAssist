'use strict';

function safeName(node) {
    if (node) {
        return node.name || safeName(node.identifier);
    } else {
        return '<anonymous>';
    }
}

exports.safeName = safeName;

function extractBases(node) {
    var bases = [];
    function _helper(_node, _bases) {
        if (_node.base) {
            _helper(_node.base, _bases);
            _bases.push(safeName(_node.base));
        }
    }

    _helper(node, bases);
    return bases;
}

exports.extractBases = extractBases;

function inScope(scope, loc) {
    return (scope.start.line <= loc.start.line) &&
           (scope.end.line >= loc.end.line);
}

exports.inScope = inScope;

function findSymbol(symbol, symbols) {
    var sameName = symbols.filter(sym => {
        return symbol.name == sym.name;
    });
    
    if (sameName.length == 0) {
        return undefined;
    }

    var numBases = symbol.bases.length;
    var sameBases = sameName.filter(s => {
        if (s.bases.length != numBases) {
            return false;
        }

        for (var i = 0; i < s.bases.length; i++) {
            var b = s.bases[i];
            if (b != symbol.bases[i]) {
                return false;
            }
        }

        return true;
    });

    if (sameBases.length == 0) {
        return undefined;
    }

    var sameScope = sameBases.filter(s => {
        return s.scope && inScope(s.scope, symbol.location);
    })

    return sameScope[0];
}

exports.findSymbol = findSymbol;

function isLocal(node) {
    if (node) {
        return node.isLocal || isLocal(node.base);
    } else {
        return false;
    }
}

exports.isLocal = isLocal;

function getLocation(node) {
    if (node.identifier) {
        return getLocation(node.identifier);
    }

    return node.loc;
}

exports.getLocation = getLocation;

function parseBase(walker, node, container, scope, parentNode, traits) {
    if (node.base === undefined) {
        return;
    }
    var name = safeName(node.base);
    var newSymbol = traits.symbol(name, traits.SymbolKind.reference, isLocal(node.base));
    newSymbol.container = container;
    newSymbol.location  = getLocation(node.base);
    newSymbol.bases     = extractBases(node.base);

    walker.addSymbol(newSymbol);

    parseBase(walker, node.base, container, scope, parentNode, traits);
}

exports.parseBase = parseBase;