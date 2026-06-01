"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrepareANonFungibleTokenTransferFromAddressEVMRI = void 0;
var PrepareANonFungibleTokenTransferFromAddressEVMRI = (function () {
    function PrepareANonFungibleTokenTransferFromAddressEVMRI() {
    }
    PrepareANonFungibleTokenTransferFromAddressEVMRI.getAttributeTypeMap = function () {
        return PrepareANonFungibleTokenTransferFromAddressEVMRI.attributeTypeMap;
    };
    PrepareANonFungibleTokenTransferFromAddressEVMRI.discriminator = undefined;
    PrepareANonFungibleTokenTransferFromAddressEVMRI.attributeTypeMap = [
        {
            "name": "inputData",
            "baseName": "inputData",
            "type": "string"
        },
        {
            "name": "nonce",
            "baseName": "nonce",
            "type": "number"
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
            "name": "sigHash",
            "baseName": "sigHash",
            "type": "string"
        },
        {
            "name": "value",
            "baseName": "value",
            "type": "PrepareANonFungibleTokenTransferFromAddressEVMRIValue"
        },
        {
            "name": "fee",
            "baseName": "fee",
            "type": "PrepareANonFungibleTokenTransferFromAddressEVMRIFee"
        },
        {
            "name": "gasLimit",
            "baseName": "gasLimit",
            "type": "number"
        },
        {
            "name": "type",
            "baseName": "type",
            "type": "PrepareANonFungibleTokenTransferFromAddressEVMRI.TypeEnum"
        }
    ];
    return PrepareANonFungibleTokenTransferFromAddressEVMRI;
}());
exports.PrepareANonFungibleTokenTransferFromAddressEVMRI = PrepareANonFungibleTokenTransferFromAddressEVMRI;
(function (PrepareANonFungibleTokenTransferFromAddressEVMRI) {
    var TypeEnum;
    (function (TypeEnum) {
        TypeEnum[TypeEnum["LegacyTransaction"] = 'legacy-transaction'] = "LegacyTransaction";
        TypeEnum[TypeEnum["AccessListTransaction"] = 'access-list-transaction'] = "AccessListTransaction";
        TypeEnum[TypeEnum["GasFeeMarketTransaction"] = 'gas-fee-market-transaction'] = "GasFeeMarketTransaction";
    })(TypeEnum = PrepareANonFungibleTokenTransferFromAddressEVMRI.TypeEnum || (PrepareANonFungibleTokenTransferFromAddressEVMRI.TypeEnum = {}));
})(PrepareANonFungibleTokenTransferFromAddressEVMRI || (exports.PrepareANonFungibleTokenTransferFromAddressEVMRI = PrepareANonFungibleTokenTransferFromAddressEVMRI = {}));
//# sourceMappingURL=prepareANonFungibleTokenTransferFromAddressEVMRI.js.map