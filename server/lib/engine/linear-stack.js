'use strict';

class StackNode {
    constructor(data) {
        this.data = data;
        this._prevNode = null;
    }
};

class ScopeEnd extends StackNode {
    /**
     * @param {Number[]} location 
     */
    constructor(location) {
        super({ location });
    }

    static is(node) {
        return node instanceof ScopeEnd;
    }
};

class LinearStack {
    constructor() {
        this.nodes = [];
    }

    /**
     * Push node on top of the stack
     * @param {StackNode} node
     */
    push(node) {
        this.nodes.push(node);
    }

    /**
     * Pop the top node and return.
     * @returns {StackNode} the top node
     */
    pop() {
        return this.nodes.pop();
    }

    /**
     * Fetch the top node of the stack.
     * @returns {StackNode} The top node of the stack.
     */
    top() {
        return this.nodes[this.length() - 1];
    }

    length() {
        return this.nodes.length;
    }

    /**
     * Search the stack down
     * @param {Function} predicate The predicate use for node match.
     * @param {Number} fromIndex The position to start search.
     */
    search(predicate, fromIndex) {
        if (fromIndex == null) {
            fromIndex = this.length();
        }
        fromIndex -= 1;
        let node = this.nodes[fromIndex];
        let skip = (n) => ScopeEnd.is(n);

        while (node) {
            if (!skip(node) && predicate(node.data)) {
                return node.data;
            }
            node = node._prevNode;
        }

        return null;
    }
}

class Scope {
    /**
     * @param {LinearStack} stack
     */
    constructor(stack, range) {
        this.stack = stack;
        this.range = range;
    }

    push(data) {
        let node = new StackNode(data);
        node._prevNode = this._prevNode;
        this._prevNode = node;
        this.stack.push(node);
    }

    /**
     * Enter a new scope.
     * @param {Scope} parent The parent scope.
     * @returns {Scope} The new scope.
     */
    enter(parent) {
        this._parent = parent;
        this._prevNode = parent && parent._prevNode;
        return this;
    }

    /**
     * Exit the scope and return it's parent scope.
     * @returns {Scope} The parent scope
     */
    exit(range) {
        let E = new ScopeEnd(range);
        E._prevNode = this._prevNode;
        this.stack.push(E);
        return this._parent;
    }
}


exports.Scope = Scope;
exports.ScopeEnd = ScopeEnd;
exports.StackNode = StackNode;
exports.LinearStack = LinearStack;

//usage
function usage() {
    let stack = new LinearStack();
    let scope = new Scope(stack);

    function enterScope() {
        scope = (new Scope(stack)).enter(scope);
    }

    function walkScope(idx) {
        scope.push('abc@' + idx);
    }

    function exitScope() {
        scope = scope.exit();
    }

    enterScope();
    walkScope(0);
    enterScope();
    walkScope(1);
    exitScope(2);
    walkScope(3);
    walkScope(4);
    exitScope();
    console.log(JSON.stringify(stack, null, 4));
}

// usage();