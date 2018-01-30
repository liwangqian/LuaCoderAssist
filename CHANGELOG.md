# Change Log

All notable changes to the "luacoderassist" extension will be documented in this file.

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
