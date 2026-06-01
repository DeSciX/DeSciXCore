"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetTokenDetailsByContractAddressEVME401 = void 0;
var GetTokenDetailsByContractAddressEVME401 = (function () {
    function GetTokenDetailsByContractAddressEVME401() {
    }
    GetTokenDetailsByContractAddressEVME401.getAttributeTypeMap = function () {
        return GetTokenDetailsByContractAddressEVME401.attributeTypeMap;
    };
    GetTokenDetailsByContractAddressEVME401.discriminator = undefined;
    GetTokenDetailsByContractAddressEVME401.attributeTypeMap = [
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
    return GetTokenDetailsByContractAddressEVME401;
}());
exports.GetTokenDetailsByContractAddressEVME401 = GetTokenDetailsByContractAddressEVME401;
//# sourceMappingURL=getTokenDetailsByContractAddressEVME401.js.map