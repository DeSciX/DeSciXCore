"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetTokenDetailsByContractAddressEVME400 = void 0;
var GetTokenDetailsByContractAddressEVME400 = (function () {
    function GetTokenDetailsByContractAddressEVME400() {
    }
    GetTokenDetailsByContractAddressEVME400.getAttributeTypeMap = function () {
        return GetTokenDetailsByContractAddressEVME400.attributeTypeMap;
    };
    GetTokenDetailsByContractAddressEVME400.discriminator = undefined;
    GetTokenDetailsByContractAddressEVME400.attributeTypeMap = [
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
    return GetTokenDetailsByContractAddressEVME400;
}());
exports.GetTokenDetailsByContractAddressEVME400 = GetTokenDetailsByContractAddressEVME400;
//# sourceMappingURL=getTokenDetailsByContractAddressEVME400.js.map