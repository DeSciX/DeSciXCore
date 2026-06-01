"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrepareANonFungibleTokenTransferFromAddressEVME400 = void 0;
var PrepareANonFungibleTokenTransferFromAddressEVME400 = (function () {
    function PrepareANonFungibleTokenTransferFromAddressEVME400() {
    }
    PrepareANonFungibleTokenTransferFromAddressEVME400.getAttributeTypeMap = function () {
        return PrepareANonFungibleTokenTransferFromAddressEVME400.attributeTypeMap;
    };
    PrepareANonFungibleTokenTransferFromAddressEVME400.discriminator = undefined;
    PrepareANonFungibleTokenTransferFromAddressEVME400.attributeTypeMap = [
        {
            "name": "code",
            "baseName": "code",
            "type": "string"
        },
        {
            "name": "message",
            "baseName": "message",
            "type": "string"
        },
        {
            "name": "details",
            "baseName": "details",
            "type": "Array<BannedIpAddressDetailsInner>"
        }
    ];
    return PrepareANonFungibleTokenTransferFromAddressEVME400;
}());
exports.PrepareANonFungibleTokenTransferFromAddressEVME400 = PrepareANonFungibleTokenTransferFromAddressEVME400;
//# sourceMappingURL=prepareANonFungibleTokenTransferFromAddressEVME400.js.map