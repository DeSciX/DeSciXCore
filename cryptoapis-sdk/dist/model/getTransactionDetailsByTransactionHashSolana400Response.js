"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetTransactionDetailsByTransactionHashSolana400Response = void 0;
var GetTransactionDetailsByTransactionHashSolana400Response = (function () {
    function GetTransactionDetailsByTransactionHashSolana400Response() {
    }
    GetTransactionDetailsByTransactionHashSolana400Response.getAttributeTypeMap = function () {
        return GetTransactionDetailsByTransactionHashSolana400Response.attributeTypeMap;
    };
    GetTransactionDetailsByTransactionHashSolana400Response.discriminator = undefined;
    GetTransactionDetailsByTransactionHashSolana400Response.attributeTypeMap = [
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
            "type": "GetTransactionDetailsByTransactionHashSolanaE400"
        }
    ];
    return GetTransactionDetailsByTransactionHashSolana400Response;
}());
exports.GetTransactionDetailsByTransactionHashSolana400Response = GetTransactionDetailsByTransactionHashSolana400Response;
//# sourceMappingURL=getTransactionDetailsByTransactionHashSolana400Response.js.map