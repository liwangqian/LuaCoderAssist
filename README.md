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
- [x] 给函数插入LDoc格式的注释
- [x] 支持LOVE、JIT、BUSTED代码补全
- [x] 支持代码补全扩展
- [x] 支持setmetatable通过__index模拟类继承的类成员补全

### 当前已支持的功能(Supported)

- **文件内符号列表(Document Symbols)**

![list](images/symbol-list.gif)

- **符号定义跳转(Goto Definition)**

![goto](images/goto-def.gif)

- **符号定义预览(Definition Peak)**

![peak](images/def-peak.gif)

- **代码补全(Code Complete)**

![complete](images/complete.gif)

- **函数特征帮助(Signatrue Help)**

![signature](images/signature.gif)

- **静态检查(LuaCheck Support)**

![diagnostics](images/diagnostics.gif)

- **代码格式化(Code Format)**

![format](images/format.gif)

- **代码度量(Code Metrics)**

![metrics](images/metrics.gif)

## 依赖(Dependences)

- [luaparse](https://github.com/oxyc/luaparse)
- [luacheck](https://github.com/mpeterv/luacheck)
- [lua-fmt](https://github.com/trixnz/lua-fmt)

-----------------------------------------------------------------------------------------------------------
