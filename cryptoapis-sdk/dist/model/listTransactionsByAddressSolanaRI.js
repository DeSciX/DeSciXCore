"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTransactionsByAddressSolanaRI = void 0;
var ListTransactionsByAddressSolanaRI = (function () {
    function ListTransactionsByAddressSolanaRI() {
    }
    ListTransactionsByAddressSolanaRI.getAttributeTypeMap = function () {
        return ListTransactionsByAddressSolanaRI.attributeTypeMap;
    };
    ListTransactionsByAddressSolanaRI.discriminator = undefined;
    ListTransactionsByAddressSolanaRI.attributeTypeMap = [
        {
            "name": "fee",
            "baseName": "fee",
            "type": "ListTransactionsByAddressSolanaRIFee"
        },
        {
            "name": "nativeBalanceChanges",
            "baseName": "nativeBalanceChanges",
            "type": "Array<ListTransactionsByAddressSolanaRINativeBalanceChangesInner>"
        },
        {
            "name": "nativeMovements",
            "baseName": "nativeMovements",
            "type": "Array<ListTransactionsByAddressSolanaRINativeMovementsInner>"
        },
        {
            "name": "signature",
            "baseName": "signature",
            "type": "string"
        },
        {
            "name": "signer",
            "baseName": "signer",
            "type": "string"
        },
        {
            "name": "timestamp",
            "baseName": "timestamp",
            "type": "number"
        },
        {
            "name": "tokenBalanceChanges",
            "baseName": "tokenBalanceChanges",
            "type": "Array<ListTransactionsByAddressSolanaRITokenBalanceChangesInner>"
        },
        {
            "name": "tokenMovements",
            "baseName": "tokenMovements",
            "type": "Array<ListTransactionsByAddressSolanaRITokenMovementsInner>"
        },
        {
            "name": "minedInBlock",
            "baseName": "minedInBlock",
            "type": "ListTransactionsByAddressSolanaRIMinedInBlock"
        }
    ];
    return ListTransactionsByAddressSolanaRI;
}());
exports.ListTransactionsByAddressSolanaRI = ListTransactionsByAddressSolanaRI;
//# sourceMappingURL=listTransactionsByAddressSolanaRI.js.map