"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAddressBalanceSolanaE400 = void 0;
var GetAddressBalanceSolanaE400 = (function () {
    function GetAddressBalanceSolanaE400() {
    }
    GetAddressBalanceSolanaE400.getAttributeTypeMap = function () {
        return GetAddressBalanceSolanaE400.attributeTypeMap;
    };
    GetAddressBalanceSolanaE400.discriminator = undefined;
    GetAddressBalanceSolanaE400.attributeTypeMap = [
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
    return GetAddressBalanceSolanaE400;
}());
exports.GetAddressBalanceSolanaE400 = GetAddressBalanceSolanaE400;
//# sourceMappingURL=getAddressBalanceSolanaE400.js.map