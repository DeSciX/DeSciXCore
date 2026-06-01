"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetBlockDetailsByBlockHeightEVM400Response = void 0;
var GetBlockDetailsByBlockHeightEVM400Response = (function () {
    function GetBlockDetailsByBlockHeightEVM400Response() {
    }
    GetBlockDetailsByBlockHeightEVM400Response.getAttributeTypeMap = function () {
        return GetBlockDetailsByBlockHeightEVM400Response.attributeTypeMap;
    };
    GetBlockDetailsByBlockHeightEVM400Response.discriminator = undefined;
    GetBlockDetailsByBlockHeightEVM400Response.attributeTypeMap = [
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
            "type": "GetBlockDetailsByBlockHeightEVME400"
        }
    ];
    return GetBlockDetailsByBlockHeightEVM400Response;
}());
exports.GetBlockDetailsByBlockHeightEVM400Response = GetBlockDetailsByBlockHeightEVM400Response;
//# sourceMappingURL=getBlockDetailsByBlockHeightEVM400Response.js.map