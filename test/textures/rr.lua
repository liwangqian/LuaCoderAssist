print(string.gmatch('hello world from Lua', '%a+'))

for v in string.gmatch('hello world from Lua', '%a+') do
    print(v)
end

function function_name(...)
    -- body
end

for k, v in pairs(debug.getregistry()) do
    print(k, type(v))
    for j, x in pairs(v) do
        print(j, type(x))
    end
end

print(debug.getregistry()._LOADLIB.__gc)
