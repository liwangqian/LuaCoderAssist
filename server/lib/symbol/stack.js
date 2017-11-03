'use strict';

const scope_1 = require('./scope');

class Stack {
    constructor() {
        this.scopes = [];
    }

    enterScope() {
        let scope = new scope_1.Scope();
        this.scopes.push(scope);
        return scope;
    }

    leaveScope() {
        this.pop();
    }

    currentScope() {
        return this.scopes[this.scopes.length - 1];
    }

    findDef(symbol) {
        let currScope = this.currentScope();
        if (currScope.valueOf(symbol.bases[symbol.bases.length-1] || symbol.nameS)) {
            
        }
    }
};

exports.Stack = Stack;