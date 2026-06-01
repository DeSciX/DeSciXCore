"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetBlockDetailsByBlockHashUTXOs401Response = void 0;
var GetBlockDetailsByBlockHashUTXOs401Response = (function () {
    function GetBlockDetailsByBlockHashUTXOs401Response() {
    }
    GetBlockDetailsByBlockHashUTXOs401Response.getAttributeTypeMap = function () {
        return GetBlockDetailsByBlockHashUTXOs401Response.attributeTypeMap;
    };
    GetBlockDetailsByBlockHashUTXOs401Response.discriminator = undefined;
    GetBlockDetailsByBlockHashUTXOs401Response.attributeTypeMap = [
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
            "type": "GetBlockDetailsByBlockHashUTXOsE401"
        }
    ];
    return GetBlockDetailsByBlockHashUTXOs401Response;
}());
exports.GetBlockDetailsByBlockHashUTXOs401Response = GetBlockDetailsByBlockHashUTXOs401Response;
//# sourceMappingURL=getBlockDetailsByBlockHashUTXOs401Response.js.map