"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetBlockDetailsByBlockHeightEVM403Response = void 0;
var GetBlockDetailsByBlockHeightEVM403Response = (function () {
    function GetBlockDetailsByBlockHeightEVM403Response() {
    }
    GetBlockDetailsByBlockHeightEVM403Response.getAttributeTypeMap = function () {
        return GetBlockDetailsByBlockHeightEVM403Response.attributeTypeMap;
    };
    GetBlockDetailsByBlockHeightEVM403Response.discriminator = undefined;
    GetBlockDetailsByBlockHeightEVM403Response.attributeTypeMap = [
        {
            "name": "apiVersion",
            "baseName": "apiVersion",
            "type": "string"
        },
        {
            "name": "requestId",
            "baseName": "requestId",
            "type": "string"
        },
        {
            "name": "context",
            "baseName": "context",
            "type": "string"
        },
        {
            "name": "error",
            "baseName": "error",
            "type": "GetBlockDetailsByBlockHeightEVME403"
        }
    ];
    return GetBlockDetailsByBlockHeightEVM403Response;
}());
exports.GetBlockDetailsByBlockHeightEVM403Response = GetBlockDetailsByBlockHeightEVM403Response;
//# sourceMappingURL=getBlockDetailsByBlockHeightEVM403Response.js.map