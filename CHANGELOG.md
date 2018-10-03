# Change Log

All notable changes to the "luacoderassist" extension will be documented in this file.

## 2.0.9 @ 2018-10-03

- 优化：LUA 5.3和JIT接口文档优化，修复LUA 5.1接口文档的个别接口未匹配问题
- 优化：luacheck静态检查配置，增加globals配置，通过luaversion匹配luacheck的std配置
- 修复：当local _io = io时，_io无法自动补全的问题

## 2.0.8 @ 2018-10-02

- 新增：更新符号解析方案，提供有限的符号类型推导功能
- 新增：基于类型符号推导，提供更全面和强大的符号补全功能，支持.luacmpleterc文件配置
- 新增：支持setmetatable，支持部分面向对象式编程风格
- 新增：支持函数返回值类型推导和符号补全
- 新增：文件符号列表支持树形显示父子关系
- 新增：集成love、jit库的接口描述文件，用于支持代码补全和符号Hover信息提示
- 修复：由于文件编码格式不一致导致的符号定义跳转行不准确的问题
- 优化：在错误信息中显示luacheck的错误码
- 优化：将部分luacheck的参数提取到配置luacheck.options中

## 1.3.8 @ 2018-03-17

- Fix file detection for the luacheck option `--config`, contribute by `FireSiku`
- Auto detect the `.luacheckrc` file for luacheck, contribute by `Positive07`
- Add luacheck delay to improve experience while editing a large lua file
- Add `LuaCoderAssist.luacheck.onSave` config
- Add `LuaCoderAssist.luacheck.onTyping` config

## 1.3.7 @ 2018-02-10

- fix issue #17.

## 1.3.6 @ 2018-01-31

- add intellisense support for `self` using in function of nested table, ralate to issue #15.

## 1.3.5 @ 2018-01-30

- fixed bug #16

## 1.3.4 @ 2018-01-28

- add: resolve `self` key word to provide precise complete list, relate to issue #13

## 1.3.3 @ 2018-01-20

- fix issue #12: fallback to vscode's default code-complete list when no defined symbol was found.

## 1.3.2 @ 2018-01-14

- fix issue #9: add `--max-line-length` to luacheck using the `format.lineWidth` configuration.

## 1.3.1 @ 2018-01-05

- fix: fixed bug in issue #7.
- fix: update the description of `LuaCoderAssist.search.externalPaths` configuration.
- add: add chinese description in README.md

## 1.3.0 @ 2017-12-03

- add: code metric codelens
- fix: symbols in new create file and remove symbols of deleted file.
- remove: Extension Settings section in README.md

## 1.2.7

- fix errors when open a file without `.lua` extension, see issue #3.

## 1.2.6

- fix errors when open a file which has syntax error.
- add `keepAfterClosed` option for luacheck diagnostics.

## 1.2.5

- fix issue #3
- add ldoc command to insert document for function.

## 1.2.3

- fix bugs when module/file return with nonthing
- add ldoc snippets

## 1.2.2

- fix issue #2

## 1.2.1

- update README.md
- add VER 1.2.0 Release Notes

## 1.2.0

- add format support
- add return table syntax support

## 1.1.0

- add support for rename local defined variables

## 1.0.2

- add support for return symbol from a file

## [1.0.0] - 2017-10-29

- Initial release

### Added

- Document symbol support;
- Goto definition, in or cross file;
- Provide hover information about a symbol;
- Diagnostics supported by using luaparse(for flycheck) and luacheck;
- Code completion support;
- Signature help support.
