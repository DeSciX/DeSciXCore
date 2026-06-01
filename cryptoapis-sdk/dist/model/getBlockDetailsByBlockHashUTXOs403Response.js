"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetBlockDetailsByBlockHashUTXOs403Response = void 0;
var GetBlockDetailsByBlockHashUTXOs403Response = (function () {
    function GetBlockDetailsByBlockHashUTXOs403Response() {
    }
    GetBlockDetailsByBlockHashUTXOs403Response.getAttributeTypeMap = function () {
        return GetBlockDetailsByBlockHashUTXOs403Response.attributeTypeMap;
    };
    GetBlockDetailsByBlockHashUTXOs403Response.discriminator = undefined;
    GetBlockDetailsByBlockHashUTXOs403Response.attributeTypeMap = [
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
            "type": "GetBlockDetailsByBlockHashUTXOsE403"
        }
    ];
    return GetBlockDetailsByBlockHashUTXOs403Response;
}());
exports.GetBlockDetailsByBlockHashUTXOs403Response = GetBlockDetailsByBlockHashUTXOs403Response;
//# sourceMappingURL=getBlockDetailsByBlockHashUTXOs403Response.js.map