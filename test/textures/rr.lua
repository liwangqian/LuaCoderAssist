local xyz

xyz = {
    name = 'xyz'
}

local x = setmetatable({}, {__index = xyz})
