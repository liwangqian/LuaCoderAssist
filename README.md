# Lua编程助手(Lua Coder Assistant)

Lua 编程助手是一款能够为Lua开发人员提供智能帮助的基于VSCODE的插件

Lua coder assistant is an vscode extension attempt to provide language intelligence for coders coding in lua language.

## 安装(Install)

本插件可在微软VSCODE插件商店中搜索`LuaCoderAssist`进行安装

Search `LuaCoderAssist` in extension market of vscode and install.

## 功能(Features)

- [x] 代码补全
- [x] 类型推导(LIMITED))
- [x] 定义跳转
- [x] 符号预览
- [x] 静态检查
- [x] 代码格式化

### 当前已支持的功能(Supported)

- **文件内符号列表(document symbols)**

![list](images/symbol-list.gif)

- **符号定义跳转(goto definition)**

![goto](images/goto-def.gif)

- **符号定义预览(definition peak)**

![peak](images/def-peak.gif)

- **代码补全(code complete)**

![complete](images/complete.gif)

- **函数特征帮助(signatrue help)**

![signature](images/signature.gif)

- **静态检查(diagnostics)**

![diagnostics](images/diagnostics.gif)

- **符号重命名(rename)**, _limitation: can only apply to local defined variable_

![rename](images/rename.gif)

- **代码格式化(code format)**, including format whole file and format select text, _**format on typing** is not supported now._

![format](images/format.gif)

- **插入函数头(insert ldoc)**

![ldoc](images/ldoc.gif)

- **代码度量(code metrics)**

![metrics](images/metrics.gif)

## 依赖(Dependences)

- luaparse: https://github.com/oxyc/luaparse
- luacheck: https://github.com/mpeterv/luacheck
- lua-fmt: https://github.com/trixnz/lua-fmt

## 发行记录(Release Notes)

### 2.0.9

- 优化：LUA 5.3和JIT接口文档优化，修复LUA 5.1接口文档的个别接口未匹配问题
- 优化：luacheck静态检查配置，增加globals配置，通过luaversion匹配luacheck的std配置
- 修复：当local _io = io时，_io无法自动补全的问题

### 2.0.8

- 新增：更新符号解析方案，提供有限的符号类型推导功能
- 新增：基于类型符号推导，提供更全面和强大的符号补全功能，支持.luacmpleterc文件配置
- 新增：支持setmetatable，支持部分面向对象式编程风格
- 新增：支持函数返回值类型推导和符号补全
- 新增：文件符号列表支持树形显示父子关系
- 新增：集成love、jit库的接口描述文件，用于支持代码补全和符号Hover信息提示
- 修复：由于文件编码格式不一致导致的符号定义跳转行不准确的问题
- 优化：在错误信息中显示luacheck的错误码
- 优化：将部分luacheck的参数提取到配置luacheck.options中

### 1.3.8

- Fix file detection for the luacheck option `--config`, contribute by `FireSiku`
- Auto detect the `.luacheckrc` file for luacheck, contribute by `Positive07`
- Add luacheck delay to improve experience while editing a large lua file
- Add `LuaCoderAssist.luacheck.onSave` config
- Add `LuaCoderAssist.luacheck.onTyping` config

### 1.3.7

- fix issue #17.

### 1.3.6

- add intellisense support for `self` using in function of nested table, ralate to issue #15.

### 1.3.5

- fixed bug #16

### 1.3.4

- add: resolve `self` key word to provide precise complete list, relate to issue #13

### 1.3.3

- fix issue #12: fallback to vscode's default code-complete list when no defined symbol were found.

### 1.3.2

- fix issue #9: add `--max-line-length` to luacheck using the `format.lineWidth` configuration.

### 1.3.1

- fix: fixed bug in issue #7.
- fix: update the description of `LuaCoderAssist.search.externalPaths` configuration.
- add: add chinese description in README.md

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
