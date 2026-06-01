"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrepareANonFungibleTokenTransferFromAddressEVMR = void 0;
var PrepareANonFungibleTokenTransferFromAddressEVMR = (function () {
    function PrepareANonFungibleTokenTransferFromAddressEVMR() {
    }
    PrepareANonFungibleTokenTransferFromAddressEVMR.getAttributeTypeMap = function () {
        return PrepareANonFungibleTokenTransferFromAddressEVMR.attributeTypeMap;
    };
    PrepareANonFungibleTokenTransferFromAddressEVMR.discriminator = undefined;
    PrepareANonFungibleTokenTransferFromAddressEVMR.attributeTypeMap = [
        {
            "name": "apiVersion",
            "baseName": "apiVersion",
            "type": "string"
        },
        {
            "name": "requestId",
            "baseName": "requestId",
            "type": "string"
        },
        {
            "name": "context",
            "baseName": "context",
            "type": "string"
        },
        {
            "name": "data",
            "baseName": "data",
            "type": "PrepareANonFungibleTokenTransferFromAddressEVMRData"
        }
    ];
    return PrepareANonFungibleTokenTransferFromAddressEVMR;
}());
exports.PrepareANonFungibleTokenTransferFromAddressEVMR = PrepareANonFungibleTokenTransferFromAddressEVMR;
//# sourceMappingURL=prepareANonFungibleTokenTransferFromAddressEVMR.js.map