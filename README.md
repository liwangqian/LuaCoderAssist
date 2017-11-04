# Lua Coder Assistant

Lua coder assistant is an vscode extension attempt to provide language intelligence for coders coding in lua language.

## Install

Search `LuaCoderAssist` in extension market of vscode and install.

## Features

![demo](images/all.gif)

### Supported

- document symbols
- goto definition
- definition peak
- code complete
- signatrue help
- diagnostics

### Not supported

- code format
- code metrics
- rename
- code refine, include **rename**, **extract variable**, **extract function**, etc.

## Requirements

* luaparse: https://github.com/oxyc/luaparse
* luacheck: https://github.com/mpeterv/luacheck

## Extension Settings

This extension contributes the following settings:

* `LuaCoderAssist.enable`: Enable/disable the extension
* `LuaCoderAssist.debug`: Debug information output enable
* `LuaCoderAssist.search.filters`: Filter patterns for file search
* `LuaCoderAssist.search.externalPaths`: External paths to be search, for dependences
* `LuaCoderAssist.search.followLinks`: Whether the links to be search
* `LuaCoderAssist.luaparse.luaversion`: The lua version, for grammer match,
* `LuaCoderAssist.luaparse.allowDefined`: Allow defining globals implicitly by setting them
* `LuaCoderAssist.luacheck.enable`: Enable/Disable luacheck for static diagnostics
* `LuaCoderAssist.luacheck.execPath`: Path of the luacheck excutable.(@ref https://github.com/mpeterv/luacheck)
* `LuaCoderAssist.luacheck.std`: Set standard globals.(@ref http://luacheck.readthedocs.io/en/stable/cli.html)
* `LuaCoderAssist.luacheck.ignore`: Filter out warnings matching patterns.(@ref http://luacheck.readthedocs.io/en/stable/cli.html)
* `LuaCoderAssist.luacheck.jobs`: Number of jobs for parallel check.(@ref http://luacheck.readthedocs.io/en/stable/cli.html)
* `LuaCoderAssist.luacheck.fileSizeLimit`: File size (KB) limit for luacheck, performance consideration
* `LuaCoderAssist.luacheck.maxProblems`: Max problems to 
* `LuaCoderAssist.luacheck.configFilePath`: The path of '.luacheckrc'
* `LuaCoderAssist.symbol.showFunctionGlobalOnly`: Only functions and global symbol will be show in document symbol list

## Known Issues

* Not support module alias, like:
```lua
    --in a.lua
    require('modu')
    local x = modu
    x.funcA()   -- here, symbol `funcA` cannot be code complete and cannot goto definition...
```

* Cannot jump to symbols in new create file, this can be solved by restart the vscode.

## Release Notes

### 1.0.2

- add support for return symbol from a file, for example:
```lua
    ---- in a.lua
    local x = {}
    function x.new()

    end

    return x

    ---- in b.lua
    local xx = require('a')
    xx.new()    --- now support all the supported features.

```

### 1.0.0

Initial release.

-----------------------------------------------------------------------------------------------------------
