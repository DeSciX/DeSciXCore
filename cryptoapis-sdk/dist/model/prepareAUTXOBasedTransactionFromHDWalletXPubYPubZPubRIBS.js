"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRIBS = void 0;
var PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRIBS = (function () {
    function PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRIBS() {
    }
    PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRIBS.getAttributeTypeMap = function () {
        return PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRIBS.attributeTypeMap;
    };
    PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRIBS.discriminator = undefined;
    PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRIBS.attributeTypeMap = [
        {
            "name": "replaceable",
            "baseName": "replaceable",
            "type": "boolean"
        },
        {
            "name": "vout",
            "baseName": "vout",
            "type": "Array<PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRIBSBCVoutInner>"
        }
    ];
    return PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRIBS;
}());
exports.PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRIBS = PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRIBS;
//# sourceMappingURL=prepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRIBS.js.map