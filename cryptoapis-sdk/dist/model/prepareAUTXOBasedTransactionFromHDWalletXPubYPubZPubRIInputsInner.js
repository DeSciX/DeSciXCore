"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRIInputsInner = void 0;
var PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRIInputsInner = (function () {
    function PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRIInputsInner() {
    }
    PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRIInputsInner.getAttributeTypeMap = function () {
        return PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRIInputsInner.attributeTypeMap;
    };
    PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRIInputsInner.discriminator = undefined;
    PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRIInputsInner.attributeTypeMap = [
        {
            "name": "address",
            "baseName": "address",
            "type": "string"
        },
        {
            "name": "change",
            "baseName": "change",
            "type": "number"
        },
        {
            "name": "derivationIndex",
            "baseName": "derivationIndex",
            "type": "number"
        },
        {
            "name": "outputIndex",
            "baseName": "outputIndex",
            "type": "number"
        },
        {
            "name": "satoshis",
            "baseName": "satoshis",
            "type": "number"
        },
        {
            "name": "script",
            "baseName": "script",
            "type": "string"
        },
        {
            "name": "sighash",
            "baseName": "sighash",
            "type": "string"
        },
        {
            "name": "transactionId",
            "baseName": "transactionId",
            "type": "string"
        }
    ];
    return PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRIInputsInner;
}());
exports.PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRIInputsInner = PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRIInputsInner;
//# sourceMappingURL=prepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRIInputsInner.js.map