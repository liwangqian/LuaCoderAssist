'use strict';

const code_metrics_1 = require('../lib/metrics');
const uri_1 = require('vscode-uri');
const vscode_1 = require('vscode');
const show_details = require('../commands/codemetrics-details');
const constants_1 = require('../lib/constants');

/**
 * copy and modified from escomplex
 * @param {Object} funcMetric function metrics from escomplex
 */
function calculateFunctionMaintainabilityIndex(funcMetric) {
    let effort = funcMetric.halstead.effort;
    let cyclomatic = funcMetric.cyclomatic;
    let lloc = funcMetric.sloc.logical;

    if (cyclomatic === 0) {
        throw new Error('Encountered function with cyclomatic complexity zero!');
    }

    let maintainability =
        171 -
        (3.42 * Math.log(effort)) -
        (0.23 * Math.log(cyclomatic)) -
        (16.2 * Math.log(lloc));

    if (maintainability > 171) {
        maintainability = 171;
    }

    maintainability = Math.max(0, (maintainability * 100) / 171);

    funcMetric.maintainability = parseFloat(maintainability).toFixed();
}

function getCodeMetricSettings() {
    let coderSettings = vscode_1.workspace.getConfiguration("LuaCoderAssist");
    return coderSettings.get("metric") || {};
}

function checkMetrics(lloc, ploc, cyclomatic, maintainability) {
    let settings = getCodeMetricSettings();
    return {
        lloc: (lloc <= settings.logicalLineMax && ploc <= settings.physicalLineMax) ? constants_1.GlyphChars.CheckPass : constants_1.GlyphChars.CheckFail,
        cyclomatic: (cyclomatic <= settings.cyclomaticMax) ? constants_1.GlyphChars.CheckPass : constants_1.GlyphChars.CheckFail,
        maintainability: (maintainability >= settings.maintainabilityMin) ? constants_1.GlyphChars.CheckPass : constants_1.GlyphChars.CheckFail
    };
}

class CodeMetricsProvider {
    constructor(coder) {
        this.coder = coder;
        this.metrics = {};
    }

    analyseCodeMetrics(document) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                let uri = document.uri;
                let filePath = uri_1.default.parse(uri).fsPath;
                resolve(code_metrics_1.module(filePath, document.getText()));
            }, 0);
        });
    }

    provideCodeLenses(document) {
        let settings = getCodeMetricSettings();
        if (!settings.enable) {
            return;
        }

        return this.analyseCodeMetrics(document)
            .then(report => {
                return report.functions.map(fn => {
                    let codeLens = new vscode_1.CodeLens(
                        new vscode_1.Range(fn.line - 1, 0, fn.line - 1, 0)
                    );

                    codeLens.data = fn;

                    return codeLens;
                });
            });
    }

    resolveCodeLens(codeLens) {
        let lloc = codeLens.data.sloc.logical;
        let ploc = codeLens.data.sloc.physical;
        let cyclomatic = codeLens.data.cyclomatic;
        let maintainability;

        codeLens.data.maintainability || calculateFunctionMaintainabilityIndex(codeLens.data);
        maintainability = codeLens.data.maintainability;

        let results = checkMetrics(lloc, ploc, cyclomatic, maintainability);
        codeLens.command = {
            title: `S(${lloc}/${ploc}${results.lloc})|C(${cyclomatic}${results.cyclomatic})|M(${maintainability}${results.maintainability})`,
            command: show_details.ShowMetricsDetailsCommand,
            arguments: [codeLens.data]
        };
        return codeLens;
    }
};

exports.CodeMetricsProvider = CodeMetricsProvider;
