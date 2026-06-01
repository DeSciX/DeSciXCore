"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubR = void 0;
var PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubR = (function () {
    function PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubR() {
    }
    PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubR.getAttributeTypeMap = function () {
        return PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubR.attributeTypeMap;
    };
    PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubR.discriminator = undefined;
    PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubR.attributeTypeMap = [
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
            "type": "PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRData"
        }
    ];
    return PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubR;
}());
exports.PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubR = PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubR;
//# sourceMappingURL=prepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubR.js.map