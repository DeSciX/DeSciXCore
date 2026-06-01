"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetTokenDetailsByContractAddressEVM401Response = void 0;
var GetTokenDetailsByContractAddressEVM401Response = (function () {
    function GetTokenDetailsByContractAddressEVM401Response() {
    }
    GetTokenDetailsByContractAddressEVM401Response.getAttributeTypeMap = function () {
        return GetTokenDetailsByContractAddressEVM401Response.attributeTypeMap;
    };
    GetTokenDetailsByContractAddressEVM401Response.discriminator = undefined;
    GetTokenDetailsByContractAddressEVM401Response.attributeTypeMap = [
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
            "type": "GetTokenDetailsByContractAddressEVME401"
        }
    ];
    return GetTokenDetailsByContractAddressEVM401Response;
}());
exports.GetTokenDetailsByContractAddressEVM401Response = GetTokenDetailsByContractAddressEVM401Response;
//# sourceMappingURL=getTokenDetailsByContractAddressEVM401Response.js.map