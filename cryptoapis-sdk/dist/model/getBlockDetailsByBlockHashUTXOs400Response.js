"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetBlockDetailsByBlockHashUTXOs400Response = void 0;
var GetBlockDetailsByBlockHashUTXOs400Response = (function () {
    function GetBlockDetailsByBlockHashUTXOs400Response() {
    }
    GetBlockDetailsByBlockHashUTXOs400Response.getAttributeTypeMap = function () {
        return GetBlockDetailsByBlockHashUTXOs400Response.attributeTypeMap;
    };
    GetBlockDetailsByBlockHashUTXOs400Response.discriminator = undefined;
    GetBlockDetailsByBlockHashUTXOs400Response.attributeTypeMap = [
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
            "type": "GetBlockDetailsByBlockHashUTXOsE400"
        }
    ];
    return GetBlockDetailsByBlockHashUTXOs400Response;
}());
exports.GetBlockDetailsByBlockHashUTXOs400Response = GetBlockDetailsByBlockHashUTXOs400Response;
//# sourceMappingURL=getBlockDetailsByBlockHashUTXOs400Response.js.map