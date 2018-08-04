module('test01', package.seeall)

local x = {}

x.abc = {}
x.abc.d = 1

function x.abc:name(...)
    return 'x.abc'
end
