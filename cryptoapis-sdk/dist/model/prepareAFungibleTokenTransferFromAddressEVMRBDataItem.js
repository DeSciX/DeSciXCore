"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrepareAFungibleTokenTransferFromAddressEVMRBDataItem = void 0;
var PrepareAFungibleTokenTransferFromAddressEVMRBDataItem = (function () {
    function PrepareAFungibleTokenTransferFromAddressEVMRBDataItem() {
    }
    PrepareAFungibleTokenTransferFromAddressEVMRBDataItem.getAttributeTypeMap = function () {
        return PrepareAFungibleTokenTransferFromAddressEVMRBDataItem.attributeTypeMap;
    };
    PrepareAFungibleTokenTransferFromAddressEVMRBDataItem.discriminator = undefined;
    PrepareAFungibleTokenTransferFromAddressEVMRBDataItem.attributeTypeMap = [
        {
            "name": "amount",
            "baseName": "amount",
            "type": "string"
        },
        {
            "name": "contract",
            "baseName": "contract",
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
            "type": "PrepareAFungibleTokenTransferFromAddressEVMRBDataItemFee"
        },
        {
            "name": "type",
            "baseName": "type",
            "type": "PrepareAFungibleTokenTransferFromAddressEVMRBDataItem.TypeEnum"
        }
    ];
    return PrepareAFungibleTokenTransferFromAddressEVMRBDataItem;
}());
exports.PrepareAFungibleTokenTransferFromAddressEVMRBDataItem = PrepareAFungibleTokenTransferFromAddressEVMRBDataItem;
(function (PrepareAFungibleTokenTransferFromAddressEVMRBDataItem) {
    var TypeEnum;
    (function (TypeEnum) {
        TypeEnum[TypeEnum["LegacyTransaction"] = 'legacy-transaction'] = "LegacyTransaction";
        TypeEnum[TypeEnum["AccessListTransaction"] = 'access-list-transaction'] = "AccessListTransaction";
        TypeEnum[TypeEnum["GasFeeMarketTransaction"] = 'gas-fee-market-transaction'] = "GasFeeMarketTransaction";
    })(TypeEnum = PrepareAFungibleTokenTransferFromAddressEVMRBDataItem.TypeEnum || (PrepareAFungibleTokenTransferFromAddressEVMRBDataItem.TypeEnum = {}));
})(PrepareAFungibleTokenTransferFromAddressEVMRBDataItem || (exports.PrepareAFungibleTokenTransferFromAddressEVMRBDataItem = PrepareAFungibleTokenTransferFromAddressEVMRBDataItem = {}));
//# sourceMappingURL=prepareAFungibleTokenTransferFromAddressEVMRBDataItem.js.map