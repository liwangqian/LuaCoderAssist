package.path = package.path .. ';' .. './test/textures/?.lua;'

require('test01')

function dump(tb)
    for k, v in pairs(tb) do
        print(k, v)
    end
end

dump(package.loaded['test01'])

local x = 2
local abcdj
local abcdfgd
