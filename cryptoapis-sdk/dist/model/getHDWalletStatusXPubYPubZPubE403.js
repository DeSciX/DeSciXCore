"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetHDWalletStatusXPubYPubZPubE403 = void 0;
var GetHDWalletStatusXPubYPubZPubE403 = (function () {
    function GetHDWalletStatusXPubYPubZPubE403() {
    }
    GetHDWalletStatusXPubYPubZPubE403.getAttributeTypeMap = function () {
        return GetHDWalletStatusXPubYPubZPubE403.attributeTypeMap;
    };
    GetHDWalletStatusXPubYPubZPubE403.discriminator = undefined;
    GetHDWalletStatusXPubYPubZPubE403.attributeTypeMap = [
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
    return GetHDWalletStatusXPubYPubZPubE403;
}());
exports.GetHDWalletStatusXPubYPubZPubE403 = GetHDWalletStatusXPubYPubZPubE403;
//# sourceMappingURL=getHDWalletStatusXPubYPubZPubE403.js.map