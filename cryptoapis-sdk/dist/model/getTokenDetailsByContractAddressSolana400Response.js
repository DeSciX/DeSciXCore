"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetTokenDetailsByContractAddressSolana400Response = void 0;
var GetTokenDetailsByContractAddressSolana400Response = (function () {
    function GetTokenDetailsByContractAddressSolana400Response() {
    }
    GetTokenDetailsByContractAddressSolana400Response.getAttributeTypeMap = function () {
        return GetTokenDetailsByContractAddressSolana400Response.attributeTypeMap;
    };
    GetTokenDetailsByContractAddressSolana400Response.discriminator = undefined;
    GetTokenDetailsByContractAddressSolana400Response.attributeTypeMap = [
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
            "type": "GetTokenDetailsByContractAddressSolanaE400"
        }
    ];
    return GetTokenDetailsByContractAddressSolana400Response;
}());
exports.GetTokenDetailsByContractAddressSolana400Response = GetTokenDetailsByContractAddressSolana400Response;
//# sourceMappingURL=getTokenDetailsByContractAddressSolana400Response.js.map