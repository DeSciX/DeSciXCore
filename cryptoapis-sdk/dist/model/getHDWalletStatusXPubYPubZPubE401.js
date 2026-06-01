"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetHDWalletStatusXPubYPubZPubE401 = void 0;
var GetHDWalletStatusXPubYPubZPubE401 = (function () {
    function GetHDWalletStatusXPubYPubZPubE401() {
    }
    GetHDWalletStatusXPubYPubZPubE401.getAttributeTypeMap = function () {
        return GetHDWalletStatusXPubYPubZPubE401.attributeTypeMap;
    };
    GetHDWalletStatusXPubYPubZPubE401.discriminator = undefined;
    GetHDWalletStatusXPubYPubZPubE401.attributeTypeMap = [
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
    return GetHDWalletStatusXPubYPubZPubE401;
}());
exports.GetHDWalletStatusXPubYPubZPubE401 = GetHDWalletStatusXPubYPubZPubE401;
//# sourceMappingURL=getHDWalletStatusXPubYPubZPubE401.js.map