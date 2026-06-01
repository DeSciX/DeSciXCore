"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetTokenDetailsByContractAddressSolanaE401 = void 0;
var GetTokenDetailsByContractAddressSolanaE401 = (function () {
    function GetTokenDetailsByContractAddressSolanaE401() {
    }
    GetTokenDetailsByContractAddressSolanaE401.getAttributeTypeMap = function () {
        return GetTokenDetailsByContractAddressSolanaE401.attributeTypeMap;
    };
    GetTokenDetailsByContractAddressSolanaE401.discriminator = undefined;
    GetTokenDetailsByContractAddressSolanaE401.attributeTypeMap = [
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
    return GetTokenDetailsByContractAddressSolanaE401;
}());
exports.GetTokenDetailsByContractAddressSolanaE401 = GetTokenDetailsByContractAddressSolanaE401;
//# sourceMappingURL=getTokenDetailsByContractAddressSolanaE401.js.map