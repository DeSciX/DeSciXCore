"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRBDataItem = void 0;
var PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRBDataItem = (function () {
    function PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRBDataItem() {
    }
    PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRBDataItem.getAttributeTypeMap = function () {
        return PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRBDataItem.attributeTypeMap;
    };
    PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRBDataItem.discriminator = undefined;
    PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRBDataItem.attributeTypeMap = [
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
            "name": "fee",
            "baseName": "fee",
            "type": "PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRBDataItemFee"
        },
        {
            "name": "prepareStrategy",
            "baseName": "prepareStrategy",
            "type": "PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRBDataItem.PrepareStrategyEnum"
        },
        {
            "name": "recipients",
            "baseName": "recipients",
            "type": "Array<PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRBDataItemRecipientsInner>"
        },
        {
            "name": "replaceable",
            "baseName": "replaceable",
            "type": "boolean"
        }
    ];
    return PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRBDataItem;
}());
exports.PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRBDataItem = PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRBDataItem;
(function (PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRBDataItem) {
    var PrepareStrategyEnum;
    (function (PrepareStrategyEnum) {
        PrepareStrategyEnum[PrepareStrategyEnum["None"] = 'none'] = "None";
        PrepareStrategyEnum[PrepareStrategyEnum["MinimizeDust"] = 'minimize-dust'] = "MinimizeDust";
        PrepareStrategyEnum[PrepareStrategyEnum["OptimizeSize"] = 'optimize-size'] = "OptimizeSize";
    })(PrepareStrategyEnum = PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRBDataItem.PrepareStrategyEnum || (PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRBDataItem.PrepareStrategyEnum = {}));
})(PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRBDataItem || (exports.PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRBDataItem = PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRBDataItem = {}));
//# sourceMappingURL=prepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRBDataItem.js.map