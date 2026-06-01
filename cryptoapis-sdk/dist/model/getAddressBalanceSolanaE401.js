"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAddressBalanceSolanaE401 = void 0;
var GetAddressBalanceSolanaE401 = (function () {
    function GetAddressBalanceSolanaE401() {
    }
    GetAddressBalanceSolanaE401.getAttributeTypeMap = function () {
        return GetAddressBalanceSolanaE401.attributeTypeMap;
    };
    GetAddressBalanceSolanaE401.discriminator = undefined;
    GetAddressBalanceSolanaE401.attributeTypeMap = [
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
    return GetAddressBalanceSolanaE401;
}());
exports.GetAddressBalanceSolanaE401 = GetAddressBalanceSolanaE401;
//# sourceMappingURL=getAddressBalanceSolanaE401.js.map