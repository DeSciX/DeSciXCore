"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTokensByAddressSolanaE400 = void 0;
var ListTokensByAddressSolanaE400 = (function () {
    function ListTokensByAddressSolanaE400() {
    }
    ListTokensByAddressSolanaE400.getAttributeTypeMap = function () {
        return ListTokensByAddressSolanaE400.attributeTypeMap;
    };
    ListTokensByAddressSolanaE400.discriminator = undefined;
    ListTokensByAddressSolanaE400.attributeTypeMap = [
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
    return ListTokensByAddressSolanaE400;
}());
exports.ListTokensByAddressSolanaE400 = ListTokensByAddressSolanaE400;
//# sourceMappingURL=listTokensByAddressSolanaE400.js.map