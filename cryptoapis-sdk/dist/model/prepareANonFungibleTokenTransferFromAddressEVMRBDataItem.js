"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrepareANonFungibleTokenTransferFromAddressEVMRBDataItem = void 0;
var PrepareANonFungibleTokenTransferFromAddressEVMRBDataItem = (function () {
    function PrepareANonFungibleTokenTransferFromAddressEVMRBDataItem() {
    }
    PrepareANonFungibleTokenTransferFromAddressEVMRBDataItem.getAttributeTypeMap = function () {
        return PrepareANonFungibleTokenTransferFromAddressEVMRBDataItem.attributeTypeMap;
    };
    PrepareANonFungibleTokenTransferFromAddressEVMRBDataItem.discriminator = undefined;
    PrepareANonFungibleTokenTransferFromAddressEVMRBDataItem.attributeTypeMap = [
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
            "name": "tokenId",
            "baseName": "tokenId",
            "type": "string"
        },
        {
            "name": "fee",
            "baseName": "fee",
            "type": "PrepareANonFungibleTokenTransferFromAddressEVMRBDataItemFee"
        },
        {
            "name": "type",
            "baseName": "type",
            "type": "PrepareANonFungibleTokenTransferFromAddressEVMRBDataItem.TypeEnum"
        }
    ];
    return PrepareANonFungibleTokenTransferFromAddressEVMRBDataItem;
}());
exports.PrepareANonFungibleTokenTransferFromAddressEVMRBDataItem = PrepareANonFungibleTokenTransferFromAddressEVMRBDataItem;
(function (PrepareANonFungibleTokenTransferFromAddressEVMRBDataItem) {
    var TypeEnum;
    (function (TypeEnum) {
        TypeEnum[TypeEnum["LegacyTransaction"] = 'legacy-transaction'] = "LegacyTransaction";
        TypeEnum[TypeEnum["AccessListTransaction"] = 'access-list-transaction'] = "AccessListTransaction";
        TypeEnum[TypeEnum["GasFeeMarketTransaction"] = 'gas-fee-market-transaction'] = "GasFeeMarketTransaction";
    })(TypeEnum = PrepareANonFungibleTokenTransferFromAddressEVMRBDataItem.TypeEnum || (PrepareANonFungibleTokenTransferFromAddressEVMRBDataItem.TypeEnum = {}));
})(PrepareANonFungibleTokenTransferFromAddressEVMRBDataItem || (exports.PrepareANonFungibleTokenTransferFromAddressEVMRBDataItem = PrepareANonFungibleTokenTransferFromAddressEVMRBDataItem = {}));
//# sourceMappingURL=prepareANonFungibleTokenTransferFromAddressEVMRBDataItem.js.map