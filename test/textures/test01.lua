local Data = {}

function Data:abc(...)
    return function(a, b, c)
        return {
            x = 1,
            y = 2
        }
    end, {
        a = 1,
        b = '123'
    }
end

local x, y = Data:abc()
local xx = Data.abc
