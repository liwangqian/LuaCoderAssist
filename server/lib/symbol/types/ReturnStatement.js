'use strict';

exports.parse = (walker, node, container, scope, parentSymbol) => {
    /** process 'return a table' situation like:
     *  in 'class.lua'
     *  ```lua
     *  local class = {}
     *  function class:funcA()
     *      ...
     *  end
     *  ...
     *  
     *  return class
     *  ```
     */
    if (node.arguments.length === 0) {
        return;
    }

    if (node.arguments.length === 1 && container.name === '_G') {
        let expt = node.arguments[0];
        if (expt.type === 'Identifier') {
            returnIdentifier(expt, walker);
        }

        walker.walkNodes(node.arguments, container, scope, parentSymbol, false);

        if (expt.type === 'TableConstructorExpression') {
            walker.document.returns = walker.document.definitions;
            walker.document.returns.forEach(d => {
                d.returnMode = true;
            });
        }
    } else {
        walker.walkNodes(node.arguments, container, scope, parentSymbol, false);
    }
}

function returnIdentifier(expt, walker) {
    let definitions = walker.document.definitions;
    walker.document.returns = definitions.filter(d => {
        return d.bases[0] === expt.name;
    });

    if (walker.document.returns) {
        walker.document.returns.forEach(d => {
            d.returnMode = true;
        });
    }
}

