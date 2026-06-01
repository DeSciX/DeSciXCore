"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetTokenDetailsByContractAddressSolana401Response = void 0;
var GetTokenDetailsByContractAddressSolana401Response = (function () {
    function GetTokenDetailsByContractAddressSolana401Response() {
    }
    GetTokenDetailsByContractAddressSolana401Response.getAttributeTypeMap = function () {
        return GetTokenDetailsByContractAddressSolana401Response.attributeTypeMap;
    };
    GetTokenDetailsByContractAddressSolana401Response.discriminator = undefined;
    GetTokenDetailsByContractAddressSolana401Response.attributeTypeMap = [
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
            "type": "GetTokenDetailsByContractAddressSolanaE401"
        }
    ];
    return GetTokenDetailsByContractAddressSolana401Response;
}());
exports.GetTokenDetailsByContractAddressSolana401Response = GetTokenDetailsByContractAddressSolana401Response;
//# sourceMappingURL=getTokenDetailsByContractAddressSolana401Response.js.map