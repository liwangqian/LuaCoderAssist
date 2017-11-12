'use strict';

function error(message, code) {
    return {
        type: 'error',
        code: code,
        message: message
    };
}

exports.error = error;

function warn(message, code) {
    return {
        type: 'warn',
        code: code,
        message: message
    };
}

exports.warn = warn;

function info(message, code) {
    return {
        type: 'info',
        code: code,
        message: message
    };
}

exports.info = info;
