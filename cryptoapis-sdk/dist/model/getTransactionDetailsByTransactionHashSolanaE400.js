"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetTransactionDetailsByTransactionHashSolanaE400 = void 0;
var GetTransactionDetailsByTransactionHashSolanaE400 = (function () {
    function GetTransactionDetailsByTransactionHashSolanaE400() {
    }
    GetTransactionDetailsByTransactionHashSolanaE400.getAttributeTypeMap = function () {
        return GetTransactionDetailsByTransactionHashSolanaE400.attributeTypeMap;
    };
    GetTransactionDetailsByTransactionHashSolanaE400.discriminator = undefined;
    GetTransactionDetailsByTransactionHashSolanaE400.attributeTypeMap = [
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
    return GetTransactionDetailsByTransactionHashSolanaE400;
}());
exports.GetTransactionDetailsByTransactionHashSolanaE400 = GetTransactionDetailsByTransactionHashSolanaE400;
//# sourceMappingURL=getTransactionDetailsByTransactionHashSolanaE400.js.map