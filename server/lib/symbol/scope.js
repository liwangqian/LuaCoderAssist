'use strict';

class Scope {
    constructor() {
        this.definitions = {};
    }

    valueOf(name) {
        return this.definitions[name];
    }

    add(name, isclass) {
        if (isclass) {
            this.definitions[name] = {};
        } else {
            this.definitions[name] = true;
        }
    }

    addToClass(className, property, isclass) {
        let aclass = this.definitions[className];
        if (isclass) {
            aclass[property] = {};
        } else {
            aclass[property] = true;
        }
    }
};

exports.Scope = Scope;