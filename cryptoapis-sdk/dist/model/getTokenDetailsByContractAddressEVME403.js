"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetTokenDetailsByContractAddressEVME403 = void 0;
var GetTokenDetailsByContractAddressEVME403 = (function () {
    function GetTokenDetailsByContractAddressEVME403() {
    }
    GetTokenDetailsByContractAddressEVME403.getAttributeTypeMap = function () {
        return GetTokenDetailsByContractAddressEVME403.attributeTypeMap;
    };
    GetTokenDetailsByContractAddressEVME403.discriminator = undefined;
    GetTokenDetailsByContractAddressEVME403.attributeTypeMap = [
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
    return GetTokenDetailsByContractAddressEVME403;
}());
exports.GetTokenDetailsByContractAddressEVME403 = GetTokenDetailsByContractAddressEVME403;
//# sourceMappingURL=getTokenDetailsByContractAddressEVME403.js.map