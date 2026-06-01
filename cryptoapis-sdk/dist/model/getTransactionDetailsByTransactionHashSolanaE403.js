"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetTransactionDetailsByTransactionHashSolanaE403 = void 0;
var GetTransactionDetailsByTransactionHashSolanaE403 = (function () {
    function GetTransactionDetailsByTransactionHashSolanaE403() {
    }
    GetTransactionDetailsByTransactionHashSolanaE403.getAttributeTypeMap = function () {
        return GetTransactionDetailsByTransactionHashSolanaE403.attributeTypeMap;
    };
    GetTransactionDetailsByTransactionHashSolanaE403.discriminator = undefined;
    GetTransactionDetailsByTransactionHashSolanaE403.attributeTypeMap = [
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
    return GetTransactionDetailsByTransactionHashSolanaE403;
}());
exports.GetTransactionDetailsByTransactionHashSolanaE403 = GetTransactionDetailsByTransactionHashSolanaE403;
//# sourceMappingURL=getTransactionDetailsByTransactionHashSolanaE403.js.map