# Change Log

All notable changes to the "luacoderassist" extension will be documented in this file.

## 2.3.2 @ 2019-7-31

- 修复：#71
- 优化：#70 
- 优化：支持提供通过下标表达式的方式添加的字符串类型的域段的代码补全(形如如：foo['xx-yy'] = bar)，暂不支持hover

## 2.3.1 @ 2019-7-31

- 优化：符号搜索的比较方法改成根据range进行比较，解决部分场景下符号无法提供补全和悬浮提示功能
- 优化：跳转到require的模块(非module定于的模块)

## 2.3.0 @ 2019-6-22

- 优化：#58 支持配置是否自动插入函数参数列表，默认自动插入

## 2.2.13 @ 2019-6-02

- 修复：#63 and #59 在`LuaCoderAssist.preloads`中配置了目录的情况下，插件崩溃的问题
- 优化：在`LuaCoderAssist.preloads`中支持预加载目录下的所有lua文件

## 2.2.12 @ 2019-05-26

- 修复：#62 设置`LuaCoderAssist.preloads`不生效的问题
- 修复：#63 Text document completion failed, invalid regular expression

## 2.2.11 @ 2019-05-23

- 修复：Fix backticks in the hover tooltips. From @alanfran

## 2.2.10 @ 2019-04-05

- 优化：#58 Autocomplete only names of functions, not parentheses and arguments
- 优化：利用调用参数简单推导返回值类型

## 2.2.9 @ 2019-02-16

- 优化：#57 require and init.lua for AwesomeWM
- 修复：#55 当文件中存在匿名函数时，无法提供文件内符号列表;
- 修复：#56 修复访问null的数据
- 修复：#49 CASE 3

## 2.2.8 @ 2019-01-20

- 新增：#44 支持require文件路径补全
- 优化：#49 支持在api描述文件中标志构造函数，已支持创建新对象，需要api的描述文件中对函数添加"kind": "constructor"属性
- 修复：#55 当文件中存在匿名函数时，无法提供文件内符号列表
- 修复：#56 修复访问null的数据

## 2.2.7 @ 2019-01-09

- 修复：#52 当存在`a = foo(a, b); b = foo(a, b)`的表达式时，存在循环类型推导，导致死循环
- 修复：#52 循环推导导致死循环，server无响应
- 修复：#53 由于workspaceFolder为undefined导致server初始化失败

## 2.2.6 @ 2018-12-23

- 修复：#49 通过赋值表达式`t.x = 123`动态地向表添加成员变量时，无法生效的问题
- 修复：#49 问题2，当函数返回的是局部表时，两次调用该函数得到的表不应该是相同的，否则向其中一个表添加成员时，会影响所有该函数返回的表
- 修复：#49 第三种场景，`local foo; function foo() end`存在两个foo符号的问题
- 修复：#50 当返回一个函数调用(尾调用)时，函数的返回值类型只推导了尾调用函数的第一个返回值
- 修复：形如`local xx = foo(params).foo()`的表达式，`xx`变量的类型推导失败的问题
- 优化：#48区分符号的range和scope，解决符号outline不跟随鼠标的问题，但是该修改无法解决在表定义的外部定义函数的场景,比如：`local tbl={}; function tb.foo() end`，此时foo方法不在tb的range内

## 2.2.5 @ 2018-12-09

- 新增：初步支持workspace工程，暂时还不支持动态增删workspace下的目录
- 修复：foo('string'):此时提供的是string库的函数列表，应该根据函数返回值进行补全

## 2.2.3 @ 2018-11-18

- 修复：当文件内存在循环依赖的表结构，例如`Class.__index=Class`时，无法提供完整的文件符号列表
- 优化：支持("string"):upper()风格的字符串函数补全
- 修复：for循环的key、value类型推导错误的问题
- 优化：从README.md文件中删掉修改记录清单
- 变更：插入函数的document统一采用带类型的格式

## 2.2.2 @ 2018-11-18

- 修复：显式require love/jit等外部库时，无法提供补全信息(#45)
- 优化：支持自定义扩展插件自带的std/love/jit等库符号(#46)
- 优化：符号补全以及符号Hover功能在复杂的函数调用关系及参数场景下正常运行
- 优化：支持显式通过_G来获取全局变量的代码补全
- 优化：支持string类型变量及字面值字符串的函数补全

## 2.2.1 @ 2018-10-21

- 修复：setmetatable在某些场景下无法生效的问题

## 2.2.0 @ 2018-10-21

- 新增：支持不同文件使用相同的模块名
- 优化：支持增删文件后的符号表增删处理
- 优化：setmetatable使用场景优化，支持函数返回setmetatable的类型推导
- 优化：支持在符号的定义处提供Hover信息
- 优化：ldoc功能，只允许在函数定义的地方添加doc
- 修复：foo().abc无法提供代码补全的问题
- 修复：变量判空以及类型判断，防止非法访问错误
- 修复：修复部分symbol没有定义state的bug
- 修复：修复匿名函数内部符号无法补全的问题

## 2.1.3 @ 2018-10-13

- 修复：在IO慢的机器上，由于kill了静态检查进程导致的代码补全过程中server异常重启
- 优化：根据文件静态检查所需的时间自适应调整检查的延时时间
- 优化：在1.28.0版本诊断信息中将错误码显示出来了，去掉告警消息前置的错误码信息
- 优化：符号解析算法优化，增强上下文推导功能

## 2.1.2 @ 2018-10-09

- 修复：当脚本中的静态检查告警从有到无时，告警信息无法清除的问题
- 修复：第三方接口文档中的table类型数据没有定义fields字段时，导致代码补全弹出异常日志
- 修复：因为脚本存在语法错误，保存时自动格式化导致异常日志弹出

## 2.1.1 @ 2018-10-07

- 修复：支持对函数插入LDoc格式的代码注释
- 修复：#41 自动补全在依赖模块通过多级目录指定时不生效的BUG

## 2.1.0 @ 2018-10-07

- 新增：lua关键字几常用语句的代码片段
- 新增：busted测试框架代码补全，删除原来的代码片段，通过按钮来控制busted是否使能
- 优化：静态检查处理逻辑优化，保证同一时刻只有一个进程检查同一文件，保证最新的修改被检查
- 修复：#39 #40

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
