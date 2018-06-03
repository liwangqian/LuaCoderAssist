M = {}

function M:abcdef(a, b)
    return a + b
end

local x = {}

x.a = {
    fc = function(...)
    end,
    fd = {
        name = 'fd'
    }
}
x.b = 'sss'
x.c = {}

x.a.fc = function(...)
    -- body
end

x.a.ed = {}

local yy = 'asd'
x.d = function(...)
    do
        local yy = 1
    end
end

return x
