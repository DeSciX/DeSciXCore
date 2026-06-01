"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetTokenDetailsByContractAddressEVM403Response = void 0;
var GetTokenDetailsByContractAddressEVM403Response = (function () {
    function GetTokenDetailsByContractAddressEVM403Response() {
    }
    GetTokenDetailsByContractAddressEVM403Response.getAttributeTypeMap = function () {
        return GetTokenDetailsByContractAddressEVM403Response.attributeTypeMap;
    };
    GetTokenDetailsByContractAddressEVM403Response.discriminator = undefined;
    GetTokenDetailsByContractAddressEVM403Response.attributeTypeMap = [
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
            "type": "GetTokenDetailsByContractAddressEVME403"
        }
    ];
    return GetTokenDetailsByContractAddressEVM403Response;
}());
exports.GetTokenDetailsByContractAddressEVM403Response = GetTokenDetailsByContractAddressEVM403Response;
//# sourceMappingURL=getTokenDetailsByContractAddressEVM403Response.js.map