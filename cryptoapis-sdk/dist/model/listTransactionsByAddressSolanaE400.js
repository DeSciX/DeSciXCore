"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTransactionsByAddressSolanaE400 = void 0;
var ListTransactionsByAddressSolanaE400 = (function () {
    function ListTransactionsByAddressSolanaE400() {
    }
    ListTransactionsByAddressSolanaE400.getAttributeTypeMap = function () {
        return ListTransactionsByAddressSolanaE400.attributeTypeMap;
    };
    ListTransactionsByAddressSolanaE400.discriminator = undefined;
    ListTransactionsByAddressSolanaE400.attributeTypeMap = [
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
    return ListTransactionsByAddressSolanaE400;
}());
exports.ListTransactionsByAddressSolanaE400 = ListTransactionsByAddressSolanaE400;
//# sourceMappingURL=listTransactionsByAddressSolanaE400.js.map