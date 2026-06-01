"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTokensByAddressSolanaE403 = void 0;
var ListTokensByAddressSolanaE403 = (function () {
    function ListTokensByAddressSolanaE403() {
    }
    ListTokensByAddressSolanaE403.getAttributeTypeMap = function () {
        return ListTokensByAddressSolanaE403.attributeTypeMap;
    };
    ListTokensByAddressSolanaE403.discriminator = undefined;
    ListTokensByAddressSolanaE403.attributeTypeMap = [
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
    return ListTokensByAddressSolanaE403;
}());
exports.ListTokensByAddressSolanaE403 = ListTokensByAddressSolanaE403;
//# sourceMappingURL=listTokensByAddressSolanaE403.js.map