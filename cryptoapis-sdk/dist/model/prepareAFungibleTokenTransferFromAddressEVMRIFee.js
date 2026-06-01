"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrepareAFungibleTokenTransferFromAddressEVMRIFee = void 0;
var PrepareAFungibleTokenTransferFromAddressEVMRIFee = (function () {
    function PrepareAFungibleTokenTransferFromAddressEVMRIFee() {
    }
    PrepareAFungibleTokenTransferFromAddressEVMRIFee.getAttributeTypeMap = function () {
        return PrepareAFungibleTokenTransferFromAddressEVMRIFee.attributeTypeMap;
    };
    PrepareAFungibleTokenTransferFromAddressEVMRIFee.discriminator = undefined;
    PrepareAFungibleTokenTransferFromAddressEVMRIFee.attributeTypeMap = [
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
            "type": "string"
        }
    ];
    return PrepareAFungibleTokenTransferFromAddressEVMRIFee;
}());
exports.PrepareAFungibleTokenTransferFromAddressEVMRIFee = PrepareAFungibleTokenTransferFromAddressEVMRIFee;
//# sourceMappingURL=prepareAFungibleTokenTransferFromAddressEVMRIFee.js.map