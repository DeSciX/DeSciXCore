"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetTransactionDetailsByTransactionHashUTXOs400Response = void 0;
var GetTransactionDetailsByTransactionHashUTXOs400Response = (function () {
    function GetTransactionDetailsByTransactionHashUTXOs400Response() {
    }
    GetTransactionDetailsByTransactionHashUTXOs400Response.getAttributeTypeMap = function () {
        return GetTransactionDetailsByTransactionHashUTXOs400Response.attributeTypeMap;
    };
    GetTransactionDetailsByTransactionHashUTXOs400Response.discriminator = undefined;
    GetTransactionDetailsByTransactionHashUTXOs400Response.attributeTypeMap = [
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
            "type": "GetTransactionDetailsByTransactionHashUTXOsE400"
        }
    ];
    return GetTransactionDetailsByTransactionHashUTXOs400Response;
}());
exports.GetTransactionDetailsByTransactionHashUTXOs400Response = GetTransactionDetailsByTransactionHashUTXOs400Response;
//# sourceMappingURL=getTransactionDetailsByTransactionHashUTXOs400Response.js.map