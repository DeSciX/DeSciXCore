"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetTokenDetailsByContractAddressEVMRI = void 0;
var GetTokenDetailsByContractAddressEVMRI = (function () {
    function GetTokenDetailsByContractAddressEVMRI() {
    }
    GetTokenDetailsByContractAddressEVMRI.getAttributeTypeMap = function () {
        return GetTokenDetailsByContractAddressEVMRI.attributeTypeMap;
    };
    GetTokenDetailsByContractAddressEVMRI.discriminator = undefined;
    GetTokenDetailsByContractAddressEVMRI.attributeTypeMap = [
        {
            "name": "name",
            "baseName": "name",
            "type": "string"
        },
        {
            "name": "standard",
            "baseName": "standard",
            "type": "string"
        },
        {
            "name": "symbol",
            "baseName": "symbol",
            "type": "string"
        },
        {
            "name": "fungibleValues",
            "baseName": "fungibleValues",
            "type": "GetTokenDetailsByContractAddressEVMRIFungibleValues"
        }
    ];
    return GetTokenDetailsByContractAddressEVMRI;
}());
exports.GetTokenDetailsByContractAddressEVMRI = GetTokenDetailsByContractAddressEVMRI;
//# sourceMappingURL=getTokenDetailsByContractAddressEVMRI.js.map