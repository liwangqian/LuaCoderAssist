/******************************************************************************
 *    Copyright 2018 The LuaCoderAssist Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ********************************************************************************/
'use strict';

class StackNode {
    constructor(data) {
        this.data = data;
        this._prevNode = null;
    }

    get prev() {
        return this._prevNode;
    }

    set prev(_prevNode) {
        this._prevNode = _prevNode;
    }
};

class ScopeEnd extends StackNode {
    /**
     * @param {Number[]} location 
     */
    constructor(location) {
        super({ location, range: location });
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
            node = node.prev;
        }

        return null;
    }

    /**
     * Walk the stack from top to bottom, Not all elements will touch.
     * @param {Function} callback The callback function
     * @param {Number} fromIndex The begin index to walk
     */
    walk(callback, fromIndex) {
        fromIndex = fromIndex || (this.length() - 1);
        let node = this.nodes[fromIndex];
        let skip = n => ScopeEnd.is(n);
        while (node) {
            if (!skip(node)) {
                callback(node.data);
            }

            node = node.prev;
        }
    }

    /**
     * Walk all the DATA node in the stack.
     * ScopeEnd tag element will be skipped.
     * @param {Function} callback The callback function invoked for every element.
     */
    forEach(callback) {
        let skip = n => ScopeEnd.is(n);
        this.nodes.forEach(node => {
            if (skip(node)) {
                return;
            }
            callback(node.data);
        });
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
        node.prev = this.prev;
        this.prev = node;
        this.stack.push(node);
    }

    /**
     * Enter a new scope.
     * @param {Scope} parent The parent scope.
     * @returns {Scope} The new scope.
     */
    enter(parent) {
        this._parent = parent;
        this.prev = parent && parent.prev;
        return this;
    }

    /**
     * Exit the scope and return it's parent scope.
     * @returns {Scope} The parent scope
     */
    exit(range) {
        let E = new ScopeEnd(range);
        E.prev = this._parent.prev;
        this.stack.push(E);
        return this._parent;
    }
}


exports.Scope = Scope;
exports.ScopeEnd = ScopeEnd;
exports.StackNode = StackNode;
exports.LinearStack = LinearStack;
