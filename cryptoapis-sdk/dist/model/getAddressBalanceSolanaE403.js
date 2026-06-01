"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAddressBalanceSolanaE403 = void 0;
var GetAddressBalanceSolanaE403 = (function () {
    function GetAddressBalanceSolanaE403() {
    }
    GetAddressBalanceSolanaE403.getAttributeTypeMap = function () {
        return GetAddressBalanceSolanaE403.attributeTypeMap;
    };
    GetAddressBalanceSolanaE403.discriminator = undefined;
    GetAddressBalanceSolanaE403.attributeTypeMap = [
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
    return GetAddressBalanceSolanaE403;
}());
exports.GetAddressBalanceSolanaE403 = GetAddressBalanceSolanaE403;
//# sourceMappingURL=getAddressBalanceSolanaE403.js.map