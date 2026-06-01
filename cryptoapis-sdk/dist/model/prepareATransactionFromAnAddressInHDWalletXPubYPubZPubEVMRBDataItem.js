"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrepareATransactionFromAnAddressInHDWalletXPubYPubZPubEVMRBDataItem = void 0;
var PrepareATransactionFromAnAddressInHDWalletXPubYPubZPubEVMRBDataItem = (function () {
    function PrepareATransactionFromAnAddressInHDWalletXPubYPubZPubEVMRBDataItem() {
        this['transactionType'] = PrepareATransactionFromAnAddressInHDWalletXPubYPubZPubEVMRBDataItem.TransactionTypeEnum.GasFeeMarketTransaction;
    }
    PrepareATransactionFromAnAddressInHDWalletXPubYPubZPubEVMRBDataItem.getAttributeTypeMap = function () {
        return PrepareATransactionFromAnAddressInHDWalletXPubYPubZPubEVMRBDataItem.attributeTypeMap;
    };
    PrepareATransactionFromAnAddressInHDWalletXPubYPubZPubEVMRBDataItem.discriminator = undefined;
    PrepareATransactionFromAnAddressInHDWalletXPubYPubZPubEVMRBDataItem.attributeTypeMap = [
        {
            "name": "additionalData",
            "baseName": "additionalData",
            "type": "string"
        },
        {
            "name": "amount",
            "baseName": "amount",
            "type": "string"
        },
        {
            "name": "nonce",
            "baseName": "nonce",
            "type": "string"
        },
        {
            "name": "recipient",
            "baseName": "recipient",
            "type": "string"
        },
        {
            "name": "sender",
            "baseName": "sender",
            "type": "string"
        },
        {
            "name": "fee",
            "baseName": "fee",
            "type": "PrepareATransactionFromAnAddressInHDWalletXPubYPubZPubEVMRBDataItemFee"
        },
        {
            "name": "transactionType",
            "baseName": "transactionType",
            "type": "PrepareATransactionFromAnAddressInHDWalletXPubYPubZPubEVMRBDataItem.TransactionTypeEnum"
        }
    ];
    return PrepareATransactionFromAnAddressInHDWalletXPubYPubZPubEVMRBDataItem;
}());
exports.PrepareATransactionFromAnAddressInHDWalletXPubYPubZPubEVMRBDataItem = PrepareATransactionFromAnAddressInHDWalletXPubYPubZPubEVMRBDataItem;
(function (PrepareATransactionFromAnAddressInHDWalletXPubYPubZPubEVMRBDataItem) {
    var TransactionTypeEnum;
    (function (TransactionTypeEnum) {
        TransactionTypeEnum[TransactionTypeEnum["LegacyTransaction"] = 'legacy-transaction'] = "LegacyTransaction";
        TransactionTypeEnum[TransactionTypeEnum["AccessListTransaction"] = 'access-list-transaction'] = "AccessListTransaction";
        TransactionTypeEnum[TransactionTypeEnum["GasFeeMarketTransaction"] = 'gas-fee-market-transaction'] = "GasFeeMarketTransaction";
    })(TransactionTypeEnum = PrepareATransactionFromAnAddressInHDWalletXPubYPubZPubEVMRBDataItem.TransactionTypeEnum || (PrepareATransactionFromAnAddressInHDWalletXPubYPubZPubEVMRBDataItem.TransactionTypeEnum = {}));
})(PrepareATransactionFromAnAddressInHDWalletXPubYPubZPubEVMRBDataItem || (exports.PrepareATransactionFromAnAddressInHDWalletXPubYPubZPubEVMRBDataItem = PrepareATransactionFromAnAddressInHDWalletXPubYPubZPubEVMRBDataItem = {}));
//# sourceMappingURL=prepareATransactionFromAnAddressInHDWalletXPubYPubZPubEVMRBDataItem.js.map