"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListHDWalletXPubYPubZPubTransactionsUTXORI = void 0;
var ListHDWalletXPubYPubZPubTransactionsUTXORI = (function () {
    function ListHDWalletXPubYPubZPubTransactionsUTXORI() {
    }
    ListHDWalletXPubYPubZPubTransactionsUTXORI.getAttributeTypeMap = function () {
        return ListHDWalletXPubYPubZPubTransactionsUTXORI.attributeTypeMap;
    };
    ListHDWalletXPubYPubZPubTransactionsUTXORI.discriminator = undefined;
    ListHDWalletXPubYPubZPubTransactionsUTXORI.attributeTypeMap = [
        {
            "name": "hash",
            "baseName": "hash",
            "type": "string"
        },
        {
            "name": "id",
            "baseName": "id",
            "type": "string"
        },
        {
            "name": "positionInBlock",
            "baseName": "positionInBlock",
            "type": "number"
        },
        {
            "name": "recipients",
            "baseName": "recipients",
            "type": "Array<ListHDWalletXPubYPubZPubTransactionsUTXORIRecipientsInner>"
        },
        {
            "name": "senders",
            "baseName": "senders",
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
            "type": "ListHDWalletXPubYPubZPubTransactionsUTXORIFee"
        },
        {
            "name": "minedInBlock",
            "baseName": "minedInBlock",
            "type": "ListHDWalletXPubYPubZPubTransactionsUTXORIMinedInBlock"
        }
    ];
    return ListHDWalletXPubYPubZPubTransactionsUTXORI;
}());
exports.ListHDWalletXPubYPubZPubTransactionsUTXORI = ListHDWalletXPubYPubZPubTransactionsUTXORI;
//# sourceMappingURL=listHDWalletXPubYPubZPubTransactionsUTXORI.js.map