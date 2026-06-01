"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTransactionsByAddressSolanaE403 = void 0;
var ListTransactionsByAddressSolanaE403 = (function () {
    function ListTransactionsByAddressSolanaE403() {
    }
    ListTransactionsByAddressSolanaE403.getAttributeTypeMap = function () {
        return ListTransactionsByAddressSolanaE403.attributeTypeMap;
    };
    ListTransactionsByAddressSolanaE403.discriminator = undefined;
    ListTransactionsByAddressSolanaE403.attributeTypeMap = [
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
    return ListTransactionsByAddressSolanaE403;
}());
exports.ListTransactionsByAddressSolanaE403 = ListTransactionsByAddressSolanaE403;
//# sourceMappingURL=listTransactionsByAddressSolanaE403.js.map