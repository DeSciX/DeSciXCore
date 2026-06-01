"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTransactionsByAddressSolanaE401 = void 0;
var ListTransactionsByAddressSolanaE401 = (function () {
    function ListTransactionsByAddressSolanaE401() {
    }
    ListTransactionsByAddressSolanaE401.getAttributeTypeMap = function () {
        return ListTransactionsByAddressSolanaE401.attributeTypeMap;
    };
    ListTransactionsByAddressSolanaE401.discriminator = undefined;
    ListTransactionsByAddressSolanaE401.attributeTypeMap = [
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
    return ListTransactionsByAddressSolanaE401;
}());
exports.ListTransactionsByAddressSolanaE401 = ListTransactionsByAddressSolanaE401;
//# sourceMappingURL=listTransactionsByAddressSolanaE401.js.map