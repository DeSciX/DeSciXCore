"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrepareANonFungibleTokenTransferFromAddressEVMRIFee = void 0;
var PrepareANonFungibleTokenTransferFromAddressEVMRIFee = (function () {
    function PrepareANonFungibleTokenTransferFromAddressEVMRIFee() {
    }
    PrepareANonFungibleTokenTransferFromAddressEVMRIFee.getAttributeTypeMap = function () {
        return PrepareANonFungibleTokenTransferFromAddressEVMRIFee.attributeTypeMap;
    };
    PrepareANonFungibleTokenTransferFromAddressEVMRIFee.discriminator = undefined;
    PrepareANonFungibleTokenTransferFromAddressEVMRIFee.attributeTypeMap = [
        {
            "name": "gasPrice",
            "baseName": "gasPrice",
            "type": "number"
        },
        {
            "name": "maxFeePerGas",
            "baseName": "maxFeePerGas",
            "type": "number"
        },
        {
            "name": "maxPriorityFeePerGas",
            "baseName": "maxPriorityFeePerGas",
            "type": "number"
        },
        {
            "name": "unit",
            "baseName": "unit",
            "type": "number"
        }
    ];
    return PrepareANonFungibleTokenTransferFromAddressEVMRIFee;
}());
exports.PrepareANonFungibleTokenTransferFromAddressEVMRIFee = PrepareANonFungibleTokenTransferFromAddressEVMRIFee;
//# sourceMappingURL=prepareANonFungibleTokenTransferFromAddressEVMRIFee.js.map