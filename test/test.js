
let expr = 'abc'
console.log(expr.trim().split(/[\.\:]/));


let aa = { abc: "abcd", xyz: "zzz" };
function Object2Array(obj) {
    let array = [];
    for (const key in obj) {
        array.push(obj[key]);
    }

    return array;
}

console.log(Object2Array(aa))

let scope = {
    symbols: { a: 'a', c: 'c' },
    parent: {
        symbols: { b: 'b' }
    }
};

let symbols = [];
do {
    symbols.push(...Object2Array(scope.symbols))
} while ((scope = scope.parent));

console.log(symbols);

try {
    let unk = null;
    let xx = unk.abc;
} catch (err) {
    console.log(err.stack);
}
