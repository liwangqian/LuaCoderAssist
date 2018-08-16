module('test01', package.seeall)

local stdlib = require('lib.stdlib')

CPubClass = {
    name = 'CPubClass',
    new = function()
        return CPubClass
    end
}

function CPubClass.abc(x, y)
    return x * y * 2
end

CPubClass.base = {
    get = function()
        -- body
    end
}
function CPubClass.base:print()
end

if CPubClass == {} then
    local xy = 1

    load('')
end

for index = 1, 10 do
    print(index)
    local zz = 'hello world'
    local foo = zz .. ' sss'
end

local n1 = 1
local n2 = n1 + 2

local nb = n1 or (n1 + 2)

local xt = CPubClass.new(nb)
