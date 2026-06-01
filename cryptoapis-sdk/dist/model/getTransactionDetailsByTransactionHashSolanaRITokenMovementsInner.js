"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetTransactionDetailsByTransactionHashSolanaRITokenMovementsInner = void 0;
var GetTransactionDetailsByTransactionHashSolanaRITokenMovementsInner = (function () {
    function GetTransactionDetailsByTransactionHashSolanaRITokenMovementsInner() {
    }
    GetTransactionDetailsByTransactionHashSolanaRITokenMovementsInner.getAttributeTypeMap = function () {
        return GetTransactionDetailsByTransactionHashSolanaRITokenMovementsInner.attributeTypeMap;
    };
    GetTransactionDetailsByTransactionHashSolanaRITokenMovementsInner.discriminator = undefined;
    GetTransactionDetailsByTransactionHashSolanaRITokenMovementsInner.attributeTypeMap = [
        {
            "name": "amount",
            "baseName": "amount",
            "type": "string"
        },
        {
            "name": "contractAddress",
            "baseName": "contractAddress",
            "type": "string"
        },
        {
            "name": "recipientAddress",
            "baseName": "recipientAddress",
            "type": "string"
        },
        {
            "name": "recipientTokenAddress",
            "baseName": "recipientTokenAddress",
            "type": "string"
        },
        {
            "name": "senderAddress",
            "baseName": "senderAddress",
            "type": "string"
        },
        {
            "name": "senderTokenAddress",
            "baseName": "senderTokenAddress",
            "type": "string"
        }
    ];
    return GetTransactionDetailsByTransactionHashSolanaRITokenMovementsInner;
}());
exports.GetTransactionDetailsByTransactionHashSolanaRITokenMovementsInner = GetTransactionDetailsByTransactionHashSolanaRITokenMovementsInner;
//# sourceMappingURL=getTransactionDetailsByTransactionHashSolanaRITokenMovementsInner.js.map