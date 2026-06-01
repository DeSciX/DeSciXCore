"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetTransactionDetailsByTransactionHashSolana401Response = void 0;
var GetTransactionDetailsByTransactionHashSolana401Response = (function () {
    function GetTransactionDetailsByTransactionHashSolana401Response() {
    }
    GetTransactionDetailsByTransactionHashSolana401Response.getAttributeTypeMap = function () {
        return GetTransactionDetailsByTransactionHashSolana401Response.attributeTypeMap;
    };
    GetTransactionDetailsByTransactionHashSolana401Response.discriminator = undefined;
    GetTransactionDetailsByTransactionHashSolana401Response.attributeTypeMap = [
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
            "type": "GetTransactionDetailsByTransactionHashSolanaE401"
        }
    ];
    return GetTransactionDetailsByTransactionHashSolana401Response;
}());
exports.GetTransactionDetailsByTransactionHashSolana401Response = GetTransactionDetailsByTransactionHashSolana401Response;
//# sourceMappingURL=getTransactionDetailsByTransactionHashSolana401Response.js.map