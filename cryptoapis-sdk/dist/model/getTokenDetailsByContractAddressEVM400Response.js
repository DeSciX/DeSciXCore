"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetTokenDetailsByContractAddressEVM400Response = void 0;
var GetTokenDetailsByContractAddressEVM400Response = (function () {
    function GetTokenDetailsByContractAddressEVM400Response() {
    }
    GetTokenDetailsByContractAddressEVM400Response.getAttributeTypeMap = function () {
        return GetTokenDetailsByContractAddressEVM400Response.attributeTypeMap;
    };
    GetTokenDetailsByContractAddressEVM400Response.discriminator = undefined;
    GetTokenDetailsByContractAddressEVM400Response.attributeTypeMap = [
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
            "name": "error",
            "baseName": "error",
            "type": "GetTokenDetailsByContractAddressEVME400"
        }
    ];
    return GetTokenDetailsByContractAddressEVM400Response;
}());
exports.GetTokenDetailsByContractAddressEVM400Response = GetTokenDetailsByContractAddressEVM400Response;
//# sourceMappingURL=getTokenDetailsByContractAddressEVM400Response.js.map