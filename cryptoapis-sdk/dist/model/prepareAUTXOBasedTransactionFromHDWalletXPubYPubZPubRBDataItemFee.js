"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRBDataItemFee = void 0;
var PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRBDataItemFee = (function () {
    function PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRBDataItemFee() {
    }
    PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRBDataItemFee.getAttributeTypeMap = function () {
        return PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRBDataItemFee.attributeTypeMap;
    };
    PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRBDataItemFee.discriminator = undefined;
    PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRBDataItemFee.attributeTypeMap = [
        {
            "name": "address",
            "baseName": "address",
            "type": "string"
        },
        {
            "name": "exactAmount",
            "baseName": "exactAmount",
            "type": "string"
        },
        {
            "name": "priority",
            "baseName": "priority",
            "type": "PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRBDataItemFee.PriorityEnum"
        }
    ];
    return PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRBDataItemFee;
}());
exports.PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRBDataItemFee = PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRBDataItemFee;
(function (PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRBDataItemFee) {
    var PriorityEnum;
    (function (PriorityEnum) {
        PriorityEnum[PriorityEnum["Slow"] = 'slow'] = "Slow";
        PriorityEnum[PriorityEnum["Standard"] = 'standard'] = "Standard";
        PriorityEnum[PriorityEnum["Fast"] = 'fast'] = "Fast";
    })(PriorityEnum = PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRBDataItemFee.PriorityEnum || (PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRBDataItemFee.PriorityEnum = {}));
})(PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRBDataItemFee || (exports.PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRBDataItemFee = PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRBDataItemFee = {}));
//# sourceMappingURL=prepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRBDataItemFee.js.map