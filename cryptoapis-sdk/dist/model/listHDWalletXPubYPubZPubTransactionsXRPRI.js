"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListHDWalletXPubYPubZPubTransactionsXRPRI = void 0;
var ListHDWalletXPubYPubZPubTransactionsXRPRI = (function () {
    function ListHDWalletXPubYPubZPubTransactionsXRPRI() {
    }
    ListHDWalletXPubYPubZPubTransactionsXRPRI.getAttributeTypeMap = function () {
        return ListHDWalletXPubYPubZPubTransactionsXRPRI.attributeTypeMap;
    };
    ListHDWalletXPubYPubZPubTransactionsXRPRI.discriminator = undefined;
    ListHDWalletXPubYPubZPubTransactionsXRPRI.attributeTypeMap = [
        {
            "name": "hash",
            "baseName": "hash",
            "type": "string"
        },
        {
            "name": "positionInBlock",
            "baseName": "positionInBlock",
            "type": "number"
        },
        {
            "name": "recipient",
            "baseName": "recipient",
            "type": "Array<ListHDWalletXPubYPubZPubTransactionsXRPRIRecipientInner>"
        },
        {
            "name": "sender",
            "baseName": "sender",
            "type": "Array<ListHDWalletXPubYPubZPubTransactionsUTXORISendersInner>"
        },
        {
            "name": "timestamp",
            "baseName": "timestamp",
            "type": "number"
        },
        {
            "name": "fee",
            "baseName": "fee",
            "type": "ListHDWalletXPubYPubZPubTransactionsXRPRIFee"
        },
        {
            "name": "minedInBlock",
            "baseName": "minedInBlock",
            "type": "ListHDWalletXPubYPubZPubTransactionsUTXORIMinedInBlock"
        }
    ];
    return ListHDWalletXPubYPubZPubTransactionsXRPRI;
}());
exports.ListHDWalletXPubYPubZPubTransactionsXRPRI = ListHDWalletXPubYPubZPubTransactionsXRPRI;
//# sourceMappingURL=listHDWalletXPubYPubZPubTransactionsXRPRI.js.map