"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrepareAFungibleTokenTransferFromAddressEVMRI = void 0;
var PrepareAFungibleTokenTransferFromAddressEVMRI = (function () {
    function PrepareAFungibleTokenTransferFromAddressEVMRI() {
    }
    PrepareAFungibleTokenTransferFromAddressEVMRI.getAttributeTypeMap = function () {
        return PrepareAFungibleTokenTransferFromAddressEVMRI.attributeTypeMap;
    };
    PrepareAFungibleTokenTransferFromAddressEVMRI.discriminator = undefined;
    PrepareAFungibleTokenTransferFromAddressEVMRI.attributeTypeMap = [
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
            "type": "PrepareAFungibleTokenTransferFromAddressEVMRIValue"
        },
        {
            "name": "fee",
            "baseName": "fee",
            "type": "PrepareAFungibleTokenTransferFromAddressEVMRIFee"
        },
        {
            "name": "gasLimit",
            "baseName": "gasLimit",
            "type": "number"
        },
        {
            "name": "type",
            "baseName": "type",
            "type": "PrepareAFungibleTokenTransferFromAddressEVMRI.TypeEnum"
        }
    ];
    return PrepareAFungibleTokenTransferFromAddressEVMRI;
}());
exports.PrepareAFungibleTokenTransferFromAddressEVMRI = PrepareAFungibleTokenTransferFromAddressEVMRI;
(function (PrepareAFungibleTokenTransferFromAddressEVMRI) {
    var TypeEnum;
    (function (TypeEnum) {
        TypeEnum[TypeEnum["LegacyTransaction"] = 'legacy-transaction'] = "LegacyTransaction";
        TypeEnum[TypeEnum["AccessListTransaction"] = 'access-list-transaction'] = "AccessListTransaction";
        TypeEnum[TypeEnum["GasFeeMarketTransaction"] = 'gas-fee-market-transaction'] = "GasFeeMarketTransaction";
    })(TypeEnum = PrepareAFungibleTokenTransferFromAddressEVMRI.TypeEnum || (PrepareAFungibleTokenTransferFromAddressEVMRI.TypeEnum = {}));
})(PrepareAFungibleTokenTransferFromAddressEVMRI || (exports.PrepareAFungibleTokenTransferFromAddressEVMRI = PrepareAFungibleTokenTransferFromAddressEVMRI = {}));
//# sourceMappingURL=prepareAFungibleTokenTransferFromAddressEVMRI.js.map