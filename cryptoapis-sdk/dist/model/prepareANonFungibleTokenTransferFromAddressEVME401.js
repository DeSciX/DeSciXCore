"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrepareANonFungibleTokenTransferFromAddressEVME401 = void 0;
var PrepareANonFungibleTokenTransferFromAddressEVME401 = (function () {
    function PrepareANonFungibleTokenTransferFromAddressEVME401() {
    }
    PrepareANonFungibleTokenTransferFromAddressEVME401.getAttributeTypeMap = function () {
        return PrepareANonFungibleTokenTransferFromAddressEVME401.attributeTypeMap;
    };
    PrepareANonFungibleTokenTransferFromAddressEVME401.discriminator = undefined;
    PrepareANonFungibleTokenTransferFromAddressEVME401.attributeTypeMap = [
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
    return PrepareANonFungibleTokenTransferFromAddressEVME401;
}());
exports.PrepareANonFungibleTokenTransferFromAddressEVME401 = PrepareANonFungibleTokenTransferFromAddressEVME401;
//# sourceMappingURL=prepareANonFungibleTokenTransferFromAddressEVME401.js.map