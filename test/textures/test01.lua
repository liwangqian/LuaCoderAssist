function newClass(a, b)
    return {
        real = a,
        image = b
    }
end

local mt = {}
mt.__add = function(a, b)
    return newClass(a.real + b.real, a.image + b.image)
end

local x0 = newClass(0, 0)
local y0 = newClass(1, 1)

setmetatable(x0, mt)

local z0 = x0 + y0

print(z0)
