"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetTransactionDetailsByTransactionHashUTXOs403Response = void 0;
var GetTransactionDetailsByTransactionHashUTXOs403Response = (function () {
    function GetTransactionDetailsByTransactionHashUTXOs403Response() {
    }
    GetTransactionDetailsByTransactionHashUTXOs403Response.getAttributeTypeMap = function () {
        return GetTransactionDetailsByTransactionHashUTXOs403Response.attributeTypeMap;
    };
    GetTransactionDetailsByTransactionHashUTXOs403Response.discriminator = undefined;
    GetTransactionDetailsByTransactionHashUTXOs403Response.attributeTypeMap = [
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
            "type": "GetTransactionDetailsByTransactionHashUTXOsE403"
        }
    ];
    return GetTransactionDetailsByTransactionHashUTXOs403Response;
}());
exports.GetTransactionDetailsByTransactionHashUTXOs403Response = GetTransactionDetailsByTransactionHashUTXOs403Response;
//# sourceMappingURL=getTransactionDetailsByTransactionHashUTXOs403Response.js.map