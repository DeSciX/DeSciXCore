"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetTokenDetailsByContractAddressSolanaE403 = void 0;
var GetTokenDetailsByContractAddressSolanaE403 = (function () {
    function GetTokenDetailsByContractAddressSolanaE403() {
    }
    GetTokenDetailsByContractAddressSolanaE403.getAttributeTypeMap = function () {
        return GetTokenDetailsByContractAddressSolanaE403.attributeTypeMap;
    };
    GetTokenDetailsByContractAddressSolanaE403.discriminator = undefined;
    GetTokenDetailsByContractAddressSolanaE403.attributeTypeMap = [
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
    return GetTokenDetailsByContractAddressSolanaE403;
}());
exports.GetTokenDetailsByContractAddressSolanaE403 = GetTokenDetailsByContractAddressSolanaE403;
//# sourceMappingURL=getTokenDetailsByContractAddressSolanaE403.js.map