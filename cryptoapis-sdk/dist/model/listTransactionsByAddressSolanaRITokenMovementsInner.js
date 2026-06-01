"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTransactionsByAddressSolanaRITokenMovementsInner = void 0;
var ListTransactionsByAddressSolanaRITokenMovementsInner = (function () {
    function ListTransactionsByAddressSolanaRITokenMovementsInner() {
    }
    ListTransactionsByAddressSolanaRITokenMovementsInner.getAttributeTypeMap = function () {
        return ListTransactionsByAddressSolanaRITokenMovementsInner.attributeTypeMap;
    };
    ListTransactionsByAddressSolanaRITokenMovementsInner.discriminator = undefined;
    ListTransactionsByAddressSolanaRITokenMovementsInner.attributeTypeMap = [
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
    return ListTransactionsByAddressSolanaRITokenMovementsInner;
}());
exports.ListTransactionsByAddressSolanaRITokenMovementsInner = ListTransactionsByAddressSolanaRITokenMovementsInner;
//# sourceMappingURL=listTransactionsByAddressSolanaRITokenMovementsInner.js.map