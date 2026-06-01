"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetRawTransactionDataUTXOs400Response = void 0;
var GetRawTransactionDataUTXOs400Response = (function () {
    function GetRawTransactionDataUTXOs400Response() {
    }
    GetRawTransactionDataUTXOs400Response.getAttributeTypeMap = function () {
        return GetRawTransactionDataUTXOs400Response.attributeTypeMap;
    };
    GetRawTransactionDataUTXOs400Response.discriminator = undefined;
    GetRawTransactionDataUTXOs400Response.attributeTypeMap = [
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
            "type": "GetRawTransactionDataUTXOsE400"
        }
    ];
    return GetRawTransactionDataUTXOs400Response;
}());
exports.GetRawTransactionDataUTXOs400Response = GetRawTransactionDataUTXOs400Response;
//# sourceMappingURL=getRawTransactionDataUTXOs400Response.js.map