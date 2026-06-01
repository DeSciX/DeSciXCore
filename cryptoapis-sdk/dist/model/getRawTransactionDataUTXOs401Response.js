"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetRawTransactionDataUTXOs401Response = void 0;
var GetRawTransactionDataUTXOs401Response = (function () {
    function GetRawTransactionDataUTXOs401Response() {
    }
    GetRawTransactionDataUTXOs401Response.getAttributeTypeMap = function () {
        return GetRawTransactionDataUTXOs401Response.attributeTypeMap;
    };
    GetRawTransactionDataUTXOs401Response.discriminator = undefined;
    GetRawTransactionDataUTXOs401Response.attributeTypeMap = [
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
            "type": "GetRawTransactionDataUTXOsE401"
        }
    ];
    return GetRawTransactionDataUTXOs401Response;
}());
exports.GetRawTransactionDataUTXOs401Response = GetRawTransactionDataUTXOs401Response;
//# sourceMappingURL=getRawTransactionDataUTXOs401Response.js.map