"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetRawTransactionDataUTXOs403Response = void 0;
var GetRawTransactionDataUTXOs403Response = (function () {
    function GetRawTransactionDataUTXOs403Response() {
    }
    GetRawTransactionDataUTXOs403Response.getAttributeTypeMap = function () {
        return GetRawTransactionDataUTXOs403Response.attributeTypeMap;
    };
    GetRawTransactionDataUTXOs403Response.discriminator = undefined;
    GetRawTransactionDataUTXOs403Response.attributeTypeMap = [
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
            "type": "GetRawTransactionDataUTXOsE403"
        }
    ];
    return GetRawTransactionDataUTXOs403Response;
}());
exports.GetRawTransactionDataUTXOs403Response = GetRawTransactionDataUTXOs403Response;
//# sourceMappingURL=getRawTransactionDataUTXOs403Response.js.map