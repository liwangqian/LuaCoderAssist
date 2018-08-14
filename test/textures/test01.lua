module('test01', package.seeall)

local stdlib = require('lib.stdlib')

CPubClass = {
    name = 'CPubClass',
    new = function()
        return {}
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

for i, v in ipairs(CPubClass) do
    print(i, v)
end
