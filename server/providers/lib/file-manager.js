"use strict";

const utils_1 = require('./utils');
const path_1 = require('path');
const tracer = require('../../tracer');

class FileManager {
    constructor() {
        this._files = {};
        this._roots = [];
    }

    reset() {
        this._files = {};
        this._roots = [];
    }

    getFiles(moduleName) {
        return this._files[moduleName] || [];
    }

    setRoots(rootPaths) {
        this._roots = rootPaths;
    }

    addFile(moduleName, file) {
        this._files[moduleName] = this._files[moduleName] || [];
        this._files[moduleName].push(file);
    }

    delFile(moduleName, file) {
        let files = this._files[moduleName];
        if (!files) {
            return;
        }

        let index = files.indexOf(file);
        index >= 0 && files.splice(index, 1);
    }

    searchFiles(options, extname) {
        let tri = tracer.instance();
        for (let i = 0; i < this._roots.length; i++) {
            let root_ = this._roots[i];
            tri.info(`search ${root_} begin.`)
            utils_1.searchFile(root_, options, (root, name) => {
                if (path_1.extname(name) == extname) {
                    let moduleName = path_1.basename(name, extname);
                    this._files[moduleName] = this._files[moduleName] || [];
                    this._files[moduleName].push(path_1.resolve(root, name));
                }
            }, (path_) => {
                tri.info(`search ${path_} end.`)
            });
        }
    }
};

var _instance = undefined;
exports.instance = () => {
    if (_instance === undefined) {
        _instance = new FileManager()
    }

    return _instance;
};