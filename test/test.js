'use strict';

function isalpha(c) {
    return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z');
}

function isdigit(c) {
    return c >= '0' && c <= '9';
}

function skip(pattern, content, offset, step) {
    while (pattern.test(content.charAt(offset))) {
        offset += step;
    }
    return offset;
}

function backward(content, offset, collection) {
    let bracketDepth = 0;

    while (true) {
        let c = content.charAt(offset);
        if (c === '.' || c === ':') {
            if (bracketDepth === 0) {
                collection.push(c);
            }
            offset--;
            offset = skip(/\s/, content, offset, -1);
            continue;
        }

        if (c === ')') {
            bracketDepth++;
            offset--;
            continue;
        }

        if (c === '(') {
            bracketDepth--;
            if (bracketDepth < 0) {
                return;
            }
            offset--;
            continue;
        }

        if (isalpha(c) || isdigit(c) || c === '_') {
            offset--;
            if (bracketDepth === 0) {
                collection.push(c);
            }
            continue;
        }

        if (c === ' ' || c === ',') {
            if (bracketDepth === 0) {
                break;
            }
            offset--;
            continue;
        }

        break;
    }

    collection.reverse();
    return offset + 1;
}

let testStr = `return x, base.Class:new().calc(x, y, z(xyz))
    .check()
    .`
let collection = [];
console.log(testStr.substring(backward(testStr, testStr.length - 1, collection)));
console.log(collection.join(''));