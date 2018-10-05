'use strict';

var LDocRequest;
(function (LDocRequest) {
    LDocRequest.type = { get method() { return "LuaCoderAssist/LDoc"; } }
})(LDocRequest = exports.LDocRequest || (exports.LDocRequest = {}));

var BustedRequest;
(function (BustedRequest) {
    BustedRequest.type = { get method() { return "LuaCoderAssist/Busted"; } }
})(BustedRequest = exports.BustedRequest || (exports.BustedRequest = {}));
