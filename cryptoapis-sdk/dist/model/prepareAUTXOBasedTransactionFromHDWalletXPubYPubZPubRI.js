"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRI = void 0;
var PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRI = (function () {
    function PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRI() {
    }
    PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRI.getAttributeTypeMap = function () {
        return PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRI.attributeTypeMap;
    };
    PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRI.discriminator = undefined;
    PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRI.attributeTypeMap = [
        {
            "name": "additionalData",
            "baseName": "additionalData",
            "type": "string"
        },
        {
            "name": "locktime",
            "baseName": "locktime",
            "type": "number"
        },
        {
            "name": "size",
            "baseName": "size",
            "type": "number"
        },
        {
            "name": "version",
            "baseName": "version",
            "type": "number"
        },
        {
            "name": "fee",
            "baseName": "fee",
            "type": "PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRIFee"
        },
        {
            "name": "feePerByte",
            "baseName": "feePerByte",
            "type": "PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRIFeePerByte"
        },
        {
            "name": "inputs",
            "baseName": "inputs",
            "type": "Array<PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRIInputsInner>"
        },
        {
            "name": "outputs",
            "baseName": "outputs",
            "type": "Array<PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRIOutputsInner>"
        },
        {
            "name": "blockchainSpecific",
            "baseName": "blockchainSpecific",
            "type": "PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRIBS"
        }
    ];
    return PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRI;
}());
exports.PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRI = PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRI;
//# sourceMappingURL=prepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRI.js.map