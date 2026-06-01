"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetHDWalletStatusXPubYPubZPubE400 = void 0;
var GetHDWalletStatusXPubYPubZPubE400 = (function () {
    function GetHDWalletStatusXPubYPubZPubE400() {
    }
    GetHDWalletStatusXPubYPubZPubE400.getAttributeTypeMap = function () {
        return GetHDWalletStatusXPubYPubZPubE400.attributeTypeMap;
    };
    GetHDWalletStatusXPubYPubZPubE400.discriminator = undefined;
    GetHDWalletStatusXPubYPubZPubE400.attributeTypeMap = [
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
    return GetHDWalletStatusXPubYPubZPubE400;
}());
exports.GetHDWalletStatusXPubYPubZPubE400 = GetHDWalletStatusXPubYPubZPubE400;
//# sourceMappingURL=getHDWalletStatusXPubYPubZPubE400.js.map