"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetTokenDetailsByContractAddressSolana403Response = void 0;
var GetTokenDetailsByContractAddressSolana403Response = (function () {
    function GetTokenDetailsByContractAddressSolana403Response() {
    }
    GetTokenDetailsByContractAddressSolana403Response.getAttributeTypeMap = function () {
        return GetTokenDetailsByContractAddressSolana403Response.attributeTypeMap;
    };
    GetTokenDetailsByContractAddressSolana403Response.discriminator = undefined;
    GetTokenDetailsByContractAddressSolana403Response.attributeTypeMap = [
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
            "type": "GetTokenDetailsByContractAddressSolanaE403"
        }
    ];
    return GetTokenDetailsByContractAddressSolana403Response;
}());
exports.GetTokenDetailsByContractAddressSolana403Response = GetTokenDetailsByContractAddressSolana403Response;
//# sourceMappingURL=getTokenDetailsByContractAddressSolana403Response.js.map