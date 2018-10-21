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

const { LoadedPackages } = require('./luaenv');
const { invalidateModuleSymbols, clearInvalidSymbols } = require('./utils');
const { analysis } = require('./core');

function parseDocument(code, uri, logger) {
    try {
        invalidateModuleSymbols(uri);

        let mdl = analysis(code, uri);

        // 用于方便查找定义
        LoadedPackages[uri] = mdl;
        let packages = LoadedPackages[mdl.name];
        if (!packages) {
            packages = {};
            LoadedPackages[mdl.name] = packages;
        }
        packages[mdl.uri] = mdl;

        clearInvalidSymbols(mdl.type.moduleMode, mdl.name);
        return mdl;
    } catch (err) {
        if (!err.stack.includes('luaparse.js')) {
            logger.error(err.stack);
        }
        return null;
    }
}

module.exports = {
    parseDocument
};
