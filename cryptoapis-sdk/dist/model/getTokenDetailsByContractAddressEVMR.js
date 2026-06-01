"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetTokenDetailsByContractAddressEVMR = void 0;
var GetTokenDetailsByContractAddressEVMR = (function () {
    function GetTokenDetailsByContractAddressEVMR() {
    }
    GetTokenDetailsByContractAddressEVMR.getAttributeTypeMap = function () {
        return GetTokenDetailsByContractAddressEVMR.attributeTypeMap;
    };
    GetTokenDetailsByContractAddressEVMR.discriminator = undefined;
    GetTokenDetailsByContractAddressEVMR.attributeTypeMap = [
        {
            "name": "apiVersion",
            "baseName": "apiVersion",
            "type": "string"
        },
        {
            "name": "requestId",
            "baseName": "requestId",
            "type": "string"
        },
        {
            "name": "context",
            "baseName": "context",
            "type": "string"
        },
        {
            "name": "data",
            "baseName": "data",
            "type": "GetTokenDetailsByContractAddressEVMRData"
        }
    ];
    return GetTokenDetailsByContractAddressEVMR;
}());
exports.GetTokenDetailsByContractAddressEVMR = GetTokenDetailsByContractAddressEVMR;
//# sourceMappingURL=getTokenDetailsByContractAddressEVMR.js.map