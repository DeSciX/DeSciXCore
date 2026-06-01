"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetTokenDetailsByContractAddressSolana404Response = void 0;
var GetTokenDetailsByContractAddressSolana404Response = (function () {
    function GetTokenDetailsByContractAddressSolana404Response() {
    }
    GetTokenDetailsByContractAddressSolana404Response.getAttributeTypeMap = function () {
        return GetTokenDetailsByContractAddressSolana404Response.attributeTypeMap;
    };
    GetTokenDetailsByContractAddressSolana404Response.discriminator = undefined;
    GetTokenDetailsByContractAddressSolana404Response.attributeTypeMap = [
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
            "type": "BlockchainDataTokenDetailsNotFound"
        }
    ];
    return GetTokenDetailsByContractAddressSolana404Response;
}());
exports.GetTokenDetailsByContractAddressSolana404Response = GetTokenDetailsByContractAddressSolana404Response;
//# sourceMappingURL=getTokenDetailsByContractAddressSolana404Response.js.map