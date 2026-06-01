"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetBlockDetailsByBlockHeightUTXOs400Response = void 0;
var GetBlockDetailsByBlockHeightUTXOs400Response = (function () {
    function GetBlockDetailsByBlockHeightUTXOs400Response() {
    }
    GetBlockDetailsByBlockHeightUTXOs400Response.getAttributeTypeMap = function () {
        return GetBlockDetailsByBlockHeightUTXOs400Response.attributeTypeMap;
    };
    GetBlockDetailsByBlockHeightUTXOs400Response.discriminator = undefined;
    GetBlockDetailsByBlockHeightUTXOs400Response.attributeTypeMap = [
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
            "type": "GetBlockDetailsByBlockHeightUTXOsE400"
        }
    ];
    return GetBlockDetailsByBlockHeightUTXOs400Response;
}());
exports.GetBlockDetailsByBlockHeightUTXOs400Response = GetBlockDetailsByBlockHeightUTXOs400Response;
//# sourceMappingURL=getBlockDetailsByBlockHeightUTXOs400Response.js.map