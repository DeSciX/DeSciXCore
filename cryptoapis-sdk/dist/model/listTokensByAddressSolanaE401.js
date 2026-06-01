"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTokensByAddressSolanaE401 = void 0;
var ListTokensByAddressSolanaE401 = (function () {
    function ListTokensByAddressSolanaE401() {
    }
    ListTokensByAddressSolanaE401.getAttributeTypeMap = function () {
        return ListTokensByAddressSolanaE401.attributeTypeMap;
    };
    ListTokensByAddressSolanaE401.discriminator = undefined;
    ListTokensByAddressSolanaE401.attributeTypeMap = [
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
    return ListTokensByAddressSolanaE401;
}());
exports.ListTokensByAddressSolanaE401 = ListTokensByAddressSolanaE401;
//# sourceMappingURL=listTokensByAddressSolanaE401.js.map