'use strict';

exports.parse = (walker, node, container, scope, parentNode) => {
    for (var i = 0; i < node.fields.length; i++) {
        var fid = node.fields[i];
        //只要解析value就可以了，key不解析了，能走到这里说明是一个匿名表创建
        fid.value && walker.walkNode(fid.value, container, scope, node);
    }
}