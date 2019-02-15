"use strict";

const utils_1 = require('./utils');
const tracer = require('../../tracer');
const path_1 = require('path');
const fs = require('fs');

const MODULE_NAME_REGEX = /(\w+)?[\\\\|/]?(\w+)\.lua/;
class FileManager {
    constructor() {
        this._moduleFileMap = {};
        this._files = [];
        this._roots = [];
        this._luaPaths = [];
    }

    reset() {
        this._moduleFileMap = {};
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
        return this._moduleFileMap[moduleName] || [];
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

    addFile(filePath) {
        const matches = MODULE_NAME_REGEX.exec(filePath);
        if (!matches) {
            let baseName = path_1.basename(filePath, ".lua");
            this.addModule(baseName, filePath);
        } else {
            let dirName = matches[1];
            let baseName = matches[2];
            if (baseName === 'init' && dirName) {
                // 优先插入以dirName为moduleName的记录
                this.addModule(dirName, filePath);
            }
            this.addModule(baseName, filePath);
        }
    }

    addModule(moduleName, file) {
        this._moduleFileMap[moduleName] = this._moduleFileMap[moduleName] || [];
        this._moduleFileMap[moduleName].push(file);
        this._files.push(file);
    }

    delFile(filePath) {
        const matches = MODULE_NAME_REGEX.exec(filePath);
        const moduleNames = [];
        if (!matches) {
            moduleNames.push(path_1.basename(filePath, '.lua'));
        } else {
            matches[1] && moduleNames.push(matches[1]);
            matches[2] && moduleNames.push(matches[2]);
        }
        moduleNames.forEach(name => {
            this.delModule(name, filePath);
        });
    }

    delModule(moduleName, filePath) {
        let files = this._moduleFileMap[moduleName];
        if (!files) {
            return;
        }

        let index = files.indexOf(filePath);
        index >= 0 && files.splice(index, 1);
        index = this._files.indexOf(filePath);
        index >= 0 && this._files.splice(index, 1);
    }

    searchFiles(options, extname) {
        let trace = tracer.instance();
        for (let i = 0; i < this._roots.length; i++) {
            let root_ = this._roots[i];
            trace.info(`search ${root_} begin.`)
            utils_1.searchFile(root_, options, (root, name) => {
                if (path_1.extname(name) == extname) {
                    this.addFile(path_1.resolve(root, name));
                }
            }, (path_) => {
                trace.info(`search ${path_} end.`)
            });
        }
    }

    matchPath(pathSegment) {
        return this._files.filter(file => {
            return file.includes(pathSegment);
        });
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