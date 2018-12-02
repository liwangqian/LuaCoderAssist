"use strict";

const utils_1 = require('./utils');
const tracer = require('../../tracer');
const path_1 = require('path');
const fs = require('fs');

class FileManager {
    constructor() {
        this._files = {};
        this._roots = [];
        this._luaPaths = [];
    }

    reset() {
        this._files = {};
        this._roots = [];
    }

    getFiles(moduleName) {
        if (this._luaPaths.length > 0) {
            /* 用来解决多个不同目录下的同名文件导致的符号解析不正确的问题,
             * 如果按路径找不到，则退化到默认版本
             */
            for (let i = 0; i < this._luaPaths.length; i++) {
                const searchPath = this._luaPaths[i].replace('?', moduleName);
                if (fs.existsSync(searchPath)) {
                    return [searchPath];
                }
            }
        }
        return this._files[moduleName] || [];
    }

    setRoots(rootPaths) {
        this._roots = rootPaths;
    }

    /**
     * @param {String} luaPath
     */
    addLuaPath(luaPath) {
        this._luaPaths.push(...luaPath.split(';'));
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
        let trace = tracer.instance();
        for (let i = 0; i < this._roots.length; i++) {
            let root_ = this._roots[i];
            trace.info(`search ${root_} begin.`)
            utils_1.searchFile(root_, options, (root, name) => {
                if (path_1.extname(name) == extname) {
                    let moduleName = path_1.basename(name, extname);
                    this._files[moduleName] = this._files[moduleName] || [];
                    this._files[moduleName].push(path_1.resolve(root, name));
                }
            }, (path_) => {
                trace.info(`search ${path_} end.`)
            });
        }
    }
};

var _instance = undefined;
/**
 * @returns {FileManager}
 */
exports.instance = () => {
    if (_instance === undefined) {
        _instance = new FileManager()
    }

    return _instance;
};