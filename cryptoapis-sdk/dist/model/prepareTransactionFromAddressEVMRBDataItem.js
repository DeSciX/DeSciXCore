"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrepareTransactionFromAddressEVMRBDataItem = void 0;
var PrepareTransactionFromAddressEVMRBDataItem = (function () {
    function PrepareTransactionFromAddressEVMRBDataItem() {
        this['type'] = PrepareTransactionFromAddressEVMRBDataItem.TypeEnum.GasFeeMarketTransaction;
    }
    PrepareTransactionFromAddressEVMRBDataItem.getAttributeTypeMap = function () {
        return PrepareTransactionFromAddressEVMRBDataItem.attributeTypeMap;
    };
    PrepareTransactionFromAddressEVMRBDataItem.discriminator = undefined;
    PrepareTransactionFromAddressEVMRBDataItem.attributeTypeMap = [
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
            "type": "PrepareTransactionFromAddressEVMRBDataItemFee"
        },
        {
            "name": "type",
            "baseName": "type",
            "type": "PrepareTransactionFromAddressEVMRBDataItem.TypeEnum"
        }
    ];
    return PrepareTransactionFromAddressEVMRBDataItem;
}());
exports.PrepareTransactionFromAddressEVMRBDataItem = PrepareTransactionFromAddressEVMRBDataItem;
(function (PrepareTransactionFromAddressEVMRBDataItem) {
    var TypeEnum;
    (function (TypeEnum) {
        TypeEnum[TypeEnum["LegacyTransaction"] = 'legacy-transaction'] = "LegacyTransaction";
        TypeEnum[TypeEnum["AccessListTransaction"] = 'access-list-transaction'] = "AccessListTransaction";
        TypeEnum[TypeEnum["GasFeeMarketTransaction"] = 'gas-fee-market-transaction'] = "GasFeeMarketTransaction";
    })(TypeEnum = PrepareTransactionFromAddressEVMRBDataItem.TypeEnum || (PrepareTransactionFromAddressEVMRBDataItem.TypeEnum = {}));
})(PrepareTransactionFromAddressEVMRBDataItem || (exports.PrepareTransactionFromAddressEVMRBDataItem = PrepareTransactionFromAddressEVMRBDataItem = {}));
//# sourceMappingURL=prepareTransactionFromAddressEVMRBDataItem.js.map