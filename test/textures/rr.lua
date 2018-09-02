local xyz

xyz = {
    name = 'xyz'
}

local x = setmetatable({}, {__index = xyz})

function xyz:print()
    return self
end

x.print()
