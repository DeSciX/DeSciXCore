"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetTransactionDetailsByTransactionHashSolana403Response = void 0;
var GetTransactionDetailsByTransactionHashSolana403Response = (function () {
    function GetTransactionDetailsByTransactionHashSolana403Response() {
    }
    GetTransactionDetailsByTransactionHashSolana403Response.getAttributeTypeMap = function () {
        return GetTransactionDetailsByTransactionHashSolana403Response.attributeTypeMap;
    };
    GetTransactionDetailsByTransactionHashSolana403Response.discriminator = undefined;
    GetTransactionDetailsByTransactionHashSolana403Response.attributeTypeMap = [
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
            "type": "GetTransactionDetailsByTransactionHashSolanaE403"
        }
    ];
    return GetTransactionDetailsByTransactionHashSolana403Response;
}());
exports.GetTransactionDetailsByTransactionHashSolana403Response = GetTransactionDetailsByTransactionHashSolana403Response;
//# sourceMappingURL=getTransactionDetailsByTransactionHashSolana403Response.js.map