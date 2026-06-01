"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetTransactionDetailsByTransactionHashSolanaRI = void 0;
var GetTransactionDetailsByTransactionHashSolanaRI = (function () {
    function GetTransactionDetailsByTransactionHashSolanaRI() {
    }
    GetTransactionDetailsByTransactionHashSolanaRI.getAttributeTypeMap = function () {
        return GetTransactionDetailsByTransactionHashSolanaRI.attributeTypeMap;
    };
    GetTransactionDetailsByTransactionHashSolanaRI.discriminator = undefined;
    GetTransactionDetailsByTransactionHashSolanaRI.attributeTypeMap = [
        {
            "name": "fee",
            "baseName": "fee",
            "type": "GetTransactionDetailsByTransactionHashSolanaRIFee"
        },
        {
            "name": "nativeBalanceChanges",
            "baseName": "nativeBalanceChanges",
            "type": "Array<GetTransactionDetailsByTransactionHashSolanaRINativeBalanceChangesInner>"
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
            "type": "Array<GetTransactionDetailsByTransactionHashSolanaRITokenBalanceChangesInner>"
        },
        {
            "name": "tokenMovements",
            "baseName": "tokenMovements",
            "type": "Array<GetTransactionDetailsByTransactionHashSolanaRITokenMovementsInner>"
        },
        {
            "name": "minedInBlock",
            "baseName": "minedInBlock",
            "type": "ListTransactionsByAddressSolanaRIMinedInBlock"
        }
    ];
    return GetTransactionDetailsByTransactionHashSolanaRI;
}());
exports.GetTransactionDetailsByTransactionHashSolanaRI = GetTransactionDetailsByTransactionHashSolanaRI;
//# sourceMappingURL=getTransactionDetailsByTransactionHashSolanaRI.js.map