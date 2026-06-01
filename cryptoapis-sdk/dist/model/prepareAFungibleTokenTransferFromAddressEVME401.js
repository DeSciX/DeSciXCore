"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrepareAFungibleTokenTransferFromAddressEVME401 = void 0;
var PrepareAFungibleTokenTransferFromAddressEVME401 = (function () {
    function PrepareAFungibleTokenTransferFromAddressEVME401() {
    }
    PrepareAFungibleTokenTransferFromAddressEVME401.getAttributeTypeMap = function () {
        return PrepareAFungibleTokenTransferFromAddressEVME401.attributeTypeMap;
    };
    PrepareAFungibleTokenTransferFromAddressEVME401.discriminator = undefined;
    PrepareAFungibleTokenTransferFromAddressEVME401.attributeTypeMap = [
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
    return PrepareAFungibleTokenTransferFromAddressEVME401;
}());
exports.PrepareAFungibleTokenTransferFromAddressEVME401 = PrepareAFungibleTokenTransferFromAddressEVME401;
//# sourceMappingURL=prepareAFungibleTokenTransferFromAddressEVME401.js.map