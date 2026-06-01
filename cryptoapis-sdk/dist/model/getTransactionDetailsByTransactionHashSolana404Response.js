"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetTransactionDetailsByTransactionHashSolana404Response = void 0;
var GetTransactionDetailsByTransactionHashSolana404Response = (function () {
    function GetTransactionDetailsByTransactionHashSolana404Response() {
    }
    GetTransactionDetailsByTransactionHashSolana404Response.getAttributeTypeMap = function () {
        return GetTransactionDetailsByTransactionHashSolana404Response.attributeTypeMap;
    };
    GetTransactionDetailsByTransactionHashSolana404Response.discriminator = undefined;
    GetTransactionDetailsByTransactionHashSolana404Response.attributeTypeMap = [
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
            "type": "BlockchainDataTransactionNotFound"
        }
    ];
    return GetTransactionDetailsByTransactionHashSolana404Response;
}());
exports.GetTransactionDetailsByTransactionHashSolana404Response = GetTransactionDetailsByTransactionHashSolana404Response;
//# sourceMappingURL=getTransactionDetailsByTransactionHashSolana404Response.js.map