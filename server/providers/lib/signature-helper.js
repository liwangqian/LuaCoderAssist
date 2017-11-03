const utils = require('./utils');

function call_stmt_context(content, offset, logger) {
    let ctx = {
        param_id: 0,
        range_f: {begin: offset, end: offset},  // full range: class.func(x,c)
        range_s: {begin: offset, end: offset}   // short range not include parameters: class.func
    };

    function right_brace(content, offset, upper_bound) {
        let match_brace = 1;
        while (offset <= upper_bound) {
            let c = content.charAt(offset);
            if (c === '(') {
                match_brace++;
            } else if (c === ')') {
                if (--match_brace === 0) {
                    return offset;
                }
            }
            offset++;
        }
    
        // 如果没有找到，或者超出了最大搜索字符数，则搜索失败
        return -1;
    }

    function left_brace(content, offset, lower_bound) {
        let match_brace = 1;
        while (offset-- >= lower_bound && match_brace > 0) {
            let c = content.charAt(offset);
            if (c === ')') {
                match_brace++;
            } else if (c === '(') {
                if (--match_brace === 0) {
                    return offset;
                }
            }
        }
    
        // 如果没有找到，或者超出了最大搜索字符数，则搜索失败
        return -1;
    }

    function skip_space_bk(content, offset, lower_bound) {
        while (offset >= lower_bound) {
            let c = content.charAt(offset);
            if (c === ' ' || c === '\r' || c === '\n' || c === '\t') {
                offset--;
            } else {
                return offset;
            }
        }
    
        return offset;
    }

    function symbol_lower_bound(content, offset, lower_bound) {
        let backwardRegex = /[a-zA-Z0-9_.:]/; // 用来查找函数符号信息
        while (offset > lower_bound) {
            if (!backwardRegex.test(content.charAt(offset))) {
                // 返回符号信息的第一个合法字符的位置
                return offset+1;
            }
            offset--;
        }
    
        if (offset <= 0) {
            // 找到字符串的开头了
            return 0;
        } else {
            // 搜索范围超过最大搜索字符数，搜索失败
            return -1;
        }
    }

    function parameter_index(content, offset, lower_bound) {
        let balance = 0;
        let counter = 0;
        while (offset-- > lower_bound) {
            let c = content.charAt(offset);
            if (c === ',' && balance === 0) {
                counter++;
            } else if (c === ')') {
                balance++;
            } else if (c === '(') {
                if (--balance < 0) {
                    // 达到左括号了，结束查找
                    return counter;
                }
            }
        }
        return -1;
    }

    let max_search_char = 200;
    // 在[lower_bound, upper_bound]范围内进行搜索
    let upper_bound = Math.min(content.length, offset + max_search_char);
    let lower_bound = Math.max(0, offset - max_search_char);

    // 向后搜索，获得右括号的位置
    let index = right_brace(content, offset, upper_bound);
    if (index < 0) {
        return undefined;
    }

    ctx.range_f.end = index + 1; // [begin, end)

    // 向前搜索，查找offset所在函数的左括号位置
    index = left_brace(content, offset, lower_bound);
    index = skip_space_bk(content, index - 1, lower_bound);
    if (index < 0 || index <= lower_bound) {
        return undefined;
    }

    ctx.range_s.end = index + 1; // [begin, end)

    // 找到匹配的左括号后，继续向前搜索函数符号信息
    index = symbol_lower_bound(content, index, lower_bound);
    if (index < 0) {
        return undefined;
    }

    ctx.range_f.begin = ctx.range_s.begin = index;
    ctx.param_id = parameter_index(content, offset, lower_bound);

    return ctx;
}

function signature_context(content, offset, logger) {
    let ctx = call_stmt_context(content, offset, logger);
    if (ctx === undefined) {
        return undefined;
    }

    let ref = utils.parseContext(content.substr(ctx.range_s.begin, ctx.range_s.end - ctx.range_s.begin));
    return {
        ref: ref,
        ctx: ctx
    };
}

exports.signature_context = signature_context;
