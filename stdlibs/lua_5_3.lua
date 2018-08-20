-- LUA 5.3 standard library stub for LuaCoderAssist

-- stdlib classes
local _file = {}
local _io = {}
local _package = {}
local _string = {}
local _os = {}
local _debug = {}
local _math = {}
local _table = {}
local _utf8 = {}
local _coroutine = {}

-- export to _G
io = _io
package = _package
string = _string
os = _os
debug = _debug
math = _math
table = _table
utf8 = _utf8
coroutine = _coroutine

-- type for iterator
local _iterator = {}
local _new = {}
local _as = {}

function _new.file()
    return _file
end

function _new.table()
    return _table
end

function _new.iterator()
    return _iterator
end

function _as.any()
    return nil
end

function _as.table()
    return _table
end

function _as.number()
    return 0
end

function _as.string()
    return ''
end

function _as.boolean()
    return true
end

-- Equivalent to file:close(). Without a file, closes the default output file.
-- @param {_file} file The file handle to close
-- @see http://www.lua.org/manual/5.3/manual.html#pdf-_io.close
function _io.close(file)
end

-- This function opens a file, in the mode specified in the string mode. In case of success, it returns a _new file handle.
-- @param {string} filename The file name
-- @param {string} mode The open mode, can be any of the following:
-- > "r": read mode (the default);
-- > "w": write mode;
-- > "a": append mode;
-- > "r+": update mode, all previous data is preserved;
-- > "w+": update mode, all previous data is erased;
-- > "a+": append update mode, previous data is preserved, writing is only allowed at the end of file.
-- @see http://www.lua.org/manual/5.3/manual.html#pdf-_io.open
function _io.open(filename, mode)
    return _new.file(filename, mode)
end

-- Equivalent to _io.output():flush().
-- @see http://www.lua.org/manual/5.3/manual.html#pdf-_io.flush
function _io.flush()
end

function _io.input(file)
    return _new.file(file)
end

function _io.lines(filename, ...)
    return _new.iterator(filename, ...)
end

function _io.output(file)
end

function _io.popen(prog, mode)
    return _new.file(prog, mode)
end

function _io.read(...)
    return _as.string()
end

function _io.tmpfile()
    return _new.file()
end

function _io.type(obj)
    return _as.string('file') or _as.string('closed file') or nil
end

function _io.write(...)
end

function _file:close()
end

function _file:flush()
end

function _file:lines(...)
    return _new.iterator()
end

function _file:read(...)
    return _as.string()
end

function _file:seek(whence, offset)
    return 0 -- file position
end

function _file:setvbuf(mode, size)
end

-- Writes the value of each of its arguments to file. The arguments must be strings or numbers.
-- @param {number|string} ... The values to be written.
-- @return {_file} The file handle
function _file:write(...)
    return _file
end

_package.config = 'string'
_package.cpath = 'string'
_package.path = 'string'
_package.loaded = {}
_package.preload = {}
_package.searchers = {}

function _package.loadlib(libname, funcname)
    return {}
end

function _package.searchpath(name, path, sep, rep)
    return _as.string()
end

function _os.clock()
    return _as.number()
end

function _os.date(format, time)
    return _as.string()
end

function _os.execute(command)
    return _as.boolean(), _as.string(), _as.number()
end

function _os.difftime(t2, t1)
    return _as.number()
end

function _os.exit(code, close)
    return _as.number(code or 0)
end

function _os.getenv(varname)
    return _as.string()
end

function _os.remove(filename)
    return true or nil, 'error message'
end

function _os.rename(oldname, newname)
    return true or nil, 'error message'
end

function _os.setlocale(locale, catagory)
    return nil or 'locale name'
end

function _os.time(table)
    return _as.number(table)
end

function _os.tmpname()
    return _as.string()
end

function _table.concat(list, sep, i, j)
    return _as.string(list, sep, i, j)
end

function _table.insert(list, pos, value)
    return _as.table(list)
end

function _table.move(a1, f, e, t, ...)
    return _as.table(...)
end

function _table.pack(...)
    return _new.table(...)
end

function _table.remove(list, pos)
    return _as.number(pos)
end

function _table.sort(list, comp)
    return _new.table(list, comp)
end

function _table.unpack(list, i, j)
    return nil -- any
end

function _math.abs(x)
    return _as.number(x)
end

function _math.acos(x)
    return _as.number(x)
end

function _math.asin(x)
    return _as.number(x)
end

function _math.atan(x)
    return _as.number(x)
end

function _math.ceil(x)
    return _as.number(x)
end

function _math.cos(x)
    return _as.number(x)
end

function _math.deg(x)
    return _as.number(x)
end

function _math.exp(x)
    return _as.number(x)
end

function _math.floor(x)
    return _as.number(x)
end

function _math.fmod(x)
    return _as.number(x)
end

function _math.huge(x)
    return _as.number(x)
end

function _math.log(x, base)
    return _as.number(x)
end

function _math.max(x, ...)
    return _as.number(x)
end

_math.maxinteger = 0
_math.mininteger = 0
_math.pi = 0

function _math.min(x, ...)
    return _as.number(x)
end

function _math.modf(x)
    return _as.number(x), _as.number(x)
end

function _math.rad(x)
    return _as.number(x)
end

function _math.random(m, n)
    return _as.number(m, n)
end

function _math.randomseed(x)
end

function _math.sin(x)
    return _as.number(x)
end

function _math.sqrt(x)
    return _as.number(x)
end

function _math.tan(x)
    return _as.number(x)
end

function _math.tointeger(x)
    return _as.number(x) or nil
end

function _math.type(x)
    return 'integer' or 'float' or nil
end

function _math.ult(m, n)
    return true
end

function _string.byte(s, i, j)
    return _as.number()
end

function _string.char(...)
    return _as.string(...)
end

-- Returns a string containing a binary representation of the given function, so that a later loadstring on this string returns a copy of the function. function must be a Lua function without upvalues.
function _string.dump(func)
    return _as.string()
end

function _string.find(s, pattern, init, plain)
    return _as.number('start indice'), _as.number('end indice'), _as.string(
        'captured string'
    )
end

function _string.format(fmtstring, ...)
    return _as.string(fmtstring, ...)
end

function _string.gmatch(s, pattern)
    return _new.iterator(s, pattern)
end

function _string.gsub(s, pattern, rep, n)
    return _as.string()
end

function _string.len(s)
    return _as.number()
end

function _string.lower(s)
    return _as.string(s)
end

function _string.match(s, pattern, init)
    return _as.string() or nil
end

function _string.pack(fmt, v1, v2)
    return _as.string()
end

function _string.packsize(fmt)
    return _as.number()
end

function _string.rep(s, n)
    return _as.string()
end

function _string.reverse(s)
    return _as.string()
end

function _string.sub(s, i, j)
    return _as.string()
end

function _string.unpack(fmt, s, pos)
    return _as.any(), _as.number()
end

function _string.upper(s)
    return _as.string()
end

function _coroutine.create(func)
    return _as.coroutine()
end

function _coroutine.isyieldable()
    return _as.boolean()
end

function _coroutine.resume(co, v1, ...)
    return _as.boolean(), _as.any('yield value') or _as.string('error message')
end

function _coroutine.running()
    return _as.coroutine()
end

function _coroutine.status(co)
    return _as.string('running' or 'suspended' or 'normal' or 'dead')
end

function _coroutine.wrap(func)
    return _as.coroutine(func)
end

function _coroutine.yield(...)
end

function function_name(...)
    -- body
end
