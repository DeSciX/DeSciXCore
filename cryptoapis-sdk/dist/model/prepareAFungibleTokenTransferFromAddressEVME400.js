"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrepareAFungibleTokenTransferFromAddressEVME400 = void 0;
var PrepareAFungibleTokenTransferFromAddressEVME400 = (function () {
    function PrepareAFungibleTokenTransferFromAddressEVME400() {
    }
    PrepareAFungibleTokenTransferFromAddressEVME400.getAttributeTypeMap = function () {
        return PrepareAFungibleTokenTransferFromAddressEVME400.attributeTypeMap;
    };
    PrepareAFungibleTokenTransferFromAddressEVME400.discriminator = undefined;
    PrepareAFungibleTokenTransferFromAddressEVME400.attributeTypeMap = [
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
    return PrepareAFungibleTokenTransferFromAddressEVME400;
}());
exports.PrepareAFungibleTokenTransferFromAddressEVME400 = PrepareAFungibleTokenTransferFromAddressEVME400;
//# sourceMappingURL=prepareAFungibleTokenTransferFromAddressEVME400.js.map