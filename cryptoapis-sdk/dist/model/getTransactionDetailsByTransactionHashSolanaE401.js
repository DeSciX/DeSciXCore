"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetTransactionDetailsByTransactionHashSolanaE401 = void 0;
var GetTransactionDetailsByTransactionHashSolanaE401 = (function () {
    function GetTransactionDetailsByTransactionHashSolanaE401() {
    }
    GetTransactionDetailsByTransactionHashSolanaE401.getAttributeTypeMap = function () {
        return GetTransactionDetailsByTransactionHashSolanaE401.attributeTypeMap;
    };
    GetTransactionDetailsByTransactionHashSolanaE401.discriminator = undefined;
    GetTransactionDetailsByTransactionHashSolanaE401.attributeTypeMap = [
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
    return GetTransactionDetailsByTransactionHashSolanaE401;
}());
exports.GetTransactionDetailsByTransactionHashSolanaE401 = GetTransactionDetailsByTransactionHashSolanaE401;
//# sourceMappingURL=getTransactionDetailsByTransactionHashSolanaE401.js.map