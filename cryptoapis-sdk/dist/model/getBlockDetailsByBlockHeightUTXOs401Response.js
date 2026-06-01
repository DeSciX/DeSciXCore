"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetBlockDetailsByBlockHeightUTXOs401Response = void 0;
var GetBlockDetailsByBlockHeightUTXOs401Response = (function () {
    function GetBlockDetailsByBlockHeightUTXOs401Response() {
    }
    GetBlockDetailsByBlockHeightUTXOs401Response.getAttributeTypeMap = function () {
        return GetBlockDetailsByBlockHeightUTXOs401Response.attributeTypeMap;
    };
    GetBlockDetailsByBlockHeightUTXOs401Response.discriminator = undefined;
    GetBlockDetailsByBlockHeightUTXOs401Response.attributeTypeMap = [
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
            "type": "GetBlockDetailsByBlockHeightUTXOsE401"
        }
    ];
    return GetBlockDetailsByBlockHeightUTXOs401Response;
}());
exports.GetBlockDetailsByBlockHeightUTXOs401Response = GetBlockDetailsByBlockHeightUTXOs401Response;
//# sourceMappingURL=getBlockDetailsByBlockHeightUTXOs401Response.js.map