'use strict';

const vscode_1 = require('vscode');
const opn_1 = require('opn');

function createQuickPickItem(label, description, detail) {
    return {
        label: label,
        description: description,
        detail: detail,
        onDidPressKey: (key) => {
            return opn_1('https://github.com/philbooth/escomplex#metrics');
        }
    }
}

function makeQuickPickItems(metrics) {
    let items = [];
    items.push(createQuickPickItem(
        `$(link-external) Logical Lines: ${metrics.sloc.logical}`,
        'A count of the imperative statements.',
        'click to view more...'
    ));

    items.push(createQuickPickItem(
        `$(link-external) Physical Lines: ${metrics.sloc.physical}`,
        'The number of lines in a module or function.',
        'click to view more...'
    ));

    items.push(createQuickPickItem(
        `$(link-external) Cyclomatic Complexity: ${metrics.cyclomatic}`,
        'Measures the complexity of the function, lower is better.',
        'click to view more...'
    ));

    items.push(createQuickPickItem(
        `$(link-external) Maintainability Index: ${metrics.maintainability}`,
        'The ease to repair or replace faulty or worn-out components, higher is better.',
        'click to view more...'
    ));

    items.push(createQuickPickItem(
        `$(link-external) Number of Parameters: ${metrics.params}`,
        'The number of parameters of a function, lower is better.',
        'click to view more...'
    ));

    let cyclomaticDensity = (metrics.cyclomaticDensity === Infinity ? 1 : metrics.cyclomaticDensity).toFixed();
    items.push(createQuickPickItem(
        `$(link-external) Cyclomatic Complexity Density: ${cyclomaticDensity}`,
        'A percentage of the Cyclomatic Complexity and Logical Lines, lower is better.',
        'click to view more...'
    ));

    return items;
}

class ShowMetricsDetails {
    constructor() {

    }

    showDetails(metrics) {
        vscode_1.window.showQuickPick(
            makeQuickPickItems(metrics),
            {
                matchOnDescription: true,
                matchOnDetail: true,
                placeHolder: 'Click to review more details introduction',
            }
        ).then(item => {
            item && item.onDidPressKey();
        });
    }
};


exports.ShowMetricsDetails = ShowMetricsDetails;
exports.ShowMetricsDetailsCommand = 'LuaCoderAssist.metrics.details';
