"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetBlockDetailsByBlockHeightUTXOs403Response = void 0;
var GetBlockDetailsByBlockHeightUTXOs403Response = (function () {
    function GetBlockDetailsByBlockHeightUTXOs403Response() {
    }
    GetBlockDetailsByBlockHeightUTXOs403Response.getAttributeTypeMap = function () {
        return GetBlockDetailsByBlockHeightUTXOs403Response.attributeTypeMap;
    };
    GetBlockDetailsByBlockHeightUTXOs403Response.discriminator = undefined;
    GetBlockDetailsByBlockHeightUTXOs403Response.attributeTypeMap = [
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
            "type": "GetBlockDetailsByBlockHeightUTXOsE403"
        }
    ];
    return GetBlockDetailsByBlockHeightUTXOs403Response;
}());
exports.GetBlockDetailsByBlockHeightUTXOs403Response = GetBlockDetailsByBlockHeightUTXOs403Response;
//# sourceMappingURL=getBlockDetailsByBlockHeightUTXOs403Response.js.map