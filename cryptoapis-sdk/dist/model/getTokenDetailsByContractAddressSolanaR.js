"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetTokenDetailsByContractAddressSolanaR = void 0;
var GetTokenDetailsByContractAddressSolanaR = (function () {
    function GetTokenDetailsByContractAddressSolanaR() {
    }
    GetTokenDetailsByContractAddressSolanaR.getAttributeTypeMap = function () {
        return GetTokenDetailsByContractAddressSolanaR.attributeTypeMap;
    };
    GetTokenDetailsByContractAddressSolanaR.discriminator = undefined;
    GetTokenDetailsByContractAddressSolanaR.attributeTypeMap = [
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
            "type": "GetTokenDetailsByContractAddressSolanaRData"
        }
    ];
    return GetTokenDetailsByContractAddressSolanaR;
}());
exports.GetTokenDetailsByContractAddressSolanaR = GetTokenDetailsByContractAddressSolanaR;
//# sourceMappingURL=getTokenDetailsByContractAddressSolanaR.js.map