"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetTokenDetailsByContractAddressSolanaE400 = void 0;
var GetTokenDetailsByContractAddressSolanaE400 = (function () {
    function GetTokenDetailsByContractAddressSolanaE400() {
    }
    GetTokenDetailsByContractAddressSolanaE400.getAttributeTypeMap = function () {
        return GetTokenDetailsByContractAddressSolanaE400.attributeTypeMap;
    };
    GetTokenDetailsByContractAddressSolanaE400.discriminator = undefined;
    GetTokenDetailsByContractAddressSolanaE400.attributeTypeMap = [
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
    return GetTokenDetailsByContractAddressSolanaE400;
}());
exports.GetTokenDetailsByContractAddressSolanaE400 = GetTokenDetailsByContractAddressSolanaE400;
//# sourceMappingURL=getTokenDetailsByContractAddressSolanaE400.js.map