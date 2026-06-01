"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListHDWalletXPubYPubZPubTransactionsEVMRI = void 0;
var ListHDWalletXPubYPubZPubTransactionsEVMRI = (function () {
    function ListHDWalletXPubYPubZPubTransactionsEVMRI() {
    }
    ListHDWalletXPubYPubZPubTransactionsEVMRI.getAttributeTypeMap = function () {
        return ListHDWalletXPubYPubZPubTransactionsEVMRI.attributeTypeMap;
    };
    ListHDWalletXPubYPubZPubTransactionsEVMRI.discriminator = undefined;
    ListHDWalletXPubYPubZPubTransactionsEVMRI.attributeTypeMap = [
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
            "type": "Array<ListHDWalletXPubYPubZPubTransactionsEVMRIRecipientInner>"
        },
        {
            "name": "sender",
            "baseName": "sender",
            "type": "Array<ListHDWalletXPubYPubZPubTransactionsEVMRISenderInner>"
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
            "type": "ListHDWalletXPubYPubZPubTransactionsEVMRIMinedInBlock"
        }
    ];
    return ListHDWalletXPubYPubZPubTransactionsEVMRI;
}());
exports.ListHDWalletXPubYPubZPubTransactionsEVMRI = ListHDWalletXPubYPubZPubTransactionsEVMRI;
//# sourceMappingURL=listHDWalletXPubYPubZPubTransactionsEVMRI.js.map