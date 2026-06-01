"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetTransactionDetailsByTransactionHashSolanaR = void 0;
var GetTransactionDetailsByTransactionHashSolanaR = (function () {
    function GetTransactionDetailsByTransactionHashSolanaR() {
    }
    GetTransactionDetailsByTransactionHashSolanaR.getAttributeTypeMap = function () {
        return GetTransactionDetailsByTransactionHashSolanaR.attributeTypeMap;
    };
    GetTransactionDetailsByTransactionHashSolanaR.discriminator = undefined;
    GetTransactionDetailsByTransactionHashSolanaR.attributeTypeMap = [
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
            "name": "data",
            "baseName": "data",
            "type": "GetTransactionDetailsByTransactionHashSolanaRData"
        }
    ];
    return GetTransactionDetailsByTransactionHashSolanaR;
}());
exports.GetTransactionDetailsByTransactionHashSolanaR = GetTransactionDetailsByTransactionHashSolanaR;
//# sourceMappingURL=getTransactionDetailsByTransactionHashSolanaR.js.map