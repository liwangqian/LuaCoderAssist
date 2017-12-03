# Lua Coder Assistant

Lua coder assistant is an vscode extension attempt to provide language intelligence for coders coding in lua language.

## Install

Search `LuaCoderAssist` in extension market of vscode and install.

## Features

### Supported

- **document symbols**
![list](images/symbol-list.gif)
- **goto definition**
![goto](images/goto-def.gif)
- **definition peak**
![peak](images/def-peak.gif)
- **code complete**
![complete](images/complete.gif)
- **signatrue help**
![signature](images/signature.gif)
- **diagnostics**
![diagnostics](images/diagnostics.gif)
- **rename**, _limitation: can only apply to local defined variable_
![rename](images/rename.gif)
- **code format**, including format whole file and format select text, _**format on typing** is not supported now._
![format](images/format.gif)
- **symbol from return table**
![return](images/return-table.gif)
- **insert ldoc**
![ldoc](images/ldoc.gif)
- **code metrics**
![metrics](images/metrics.gif)

### Not supported

- extract variable
- extract function
- symbol document support

## Dependences

* luaparse: https://github.com/oxyc/luaparse
* luacheck: https://github.com/mpeterv/luacheck
* lua-fmt: https://github.com/trixnz/lua-fmt

## Known Issues

* Not support module alias, like:
```lua
    --in a.lua
    require('modu')
    local x = modu
    x.funcA()   -- here, symbol `funcA` cannot be code complete and cannot goto definition...
```

## Release Notes

### 1.3.0
- add: code metric codelens
- fix: symbols in new create file and remove symbols of deleted file.
- remove: Extension Settings section in README.md

### 1.2.7
- fix errors when open a file without `.lua` extension, see issue #3.

### 1.2.6
- fix errors when open a file which has syntax error.
- add `keepAfterClosed` option for luacheck diagnostics.

### 1.2.5
- fix issue #3
- add ldoc command to insert document for function.
- add ldoc context menu '**Insert LDoc**'.

### 1.2.3
- fix bugs when module/file return with nonthing
- add ldoc snippets

### 1.2.2
- fix issue #2

### 1.2.1
- update README.md
- add VER 1.2.0 Release Notes

### 1.2.0
- add format support
- add return table syntax support

### 1.1.0

- add support for rename local defined variables

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
