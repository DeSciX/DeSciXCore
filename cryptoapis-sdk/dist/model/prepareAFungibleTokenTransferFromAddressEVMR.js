"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrepareAFungibleTokenTransferFromAddressEVMR = void 0;
var PrepareAFungibleTokenTransferFromAddressEVMR = (function () {
    function PrepareAFungibleTokenTransferFromAddressEVMR() {
    }
    PrepareAFungibleTokenTransferFromAddressEVMR.getAttributeTypeMap = function () {
        return PrepareAFungibleTokenTransferFromAddressEVMR.attributeTypeMap;
    };
    PrepareAFungibleTokenTransferFromAddressEVMR.discriminator = undefined;
    PrepareAFungibleTokenTransferFromAddressEVMR.attributeTypeMap = [
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
            "type": "PrepareAFungibleTokenTransferFromAddressEVMRData"
        }
    ];
    return PrepareAFungibleTokenTransferFromAddressEVMR;
}());
exports.PrepareAFungibleTokenTransferFromAddressEVMR = PrepareAFungibleTokenTransferFromAddressEVMR;
//# sourceMappingURL=prepareAFungibleTokenTransferFromAddressEVMR.js.map