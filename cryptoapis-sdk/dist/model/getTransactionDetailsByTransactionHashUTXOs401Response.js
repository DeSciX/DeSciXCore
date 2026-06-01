"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetTransactionDetailsByTransactionHashUTXOs401Response = void 0;
var GetTransactionDetailsByTransactionHashUTXOs401Response = (function () {
    function GetTransactionDetailsByTransactionHashUTXOs401Response() {
    }
    GetTransactionDetailsByTransactionHashUTXOs401Response.getAttributeTypeMap = function () {
        return GetTransactionDetailsByTransactionHashUTXOs401Response.attributeTypeMap;
    };
    GetTransactionDetailsByTransactionHashUTXOs401Response.discriminator = undefined;
    GetTransactionDetailsByTransactionHashUTXOs401Response.attributeTypeMap = [
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
            "type": "GetTransactionDetailsByTransactionHashUTXOsE401"
        }
    ];
    return GetTransactionDetailsByTransactionHashUTXOs401Response;
}());
exports.GetTransactionDetailsByTransactionHashUTXOs401Response = GetTransactionDetailsByTransactionHashUTXOs401Response;
//# sourceMappingURL=getTransactionDetailsByTransactionHashUTXOs401Response.js.map