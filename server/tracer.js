'use strict';

class Tracer {
    constructor() {
        this.coder = undefined;
    }

    init(coder) {
        this.coder = coder;
    }

    enabled() {
        return this.coder && this.coder.initialized() && this.coder.settings.debug;
    }
    
    info(msg) {
        if (this.enabled()) {
            this.coder.conn.console.info(msg);
        }
    }

    warn(msg) {
        if (this.enabled()) {
            this.coder.conn.console.warn(msg);
        }
    }

    error(msg) {
        if (this.enabled()) {
            this.coder.conn.console.error(msg);
        }
    }
}

var _instance = undefined;
exports.instance = function () {
    if (_instance === undefined) {
        _instance = new Tracer();
    }

    return _instance;
};