module('test01', package.seeall)

local x = {}

function function_name(a, b, c)
    local x = 1
    return x
end

local y = function(...)
    -- body
end

function x.abc(...)
    -- body
end

for k, v in pairs(_G.package.loaders) do
    print(k, v)
end
