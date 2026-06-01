"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAddressBalanceSolanaR = void 0;
var GetAddressBalanceSolanaR = (function () {
    function GetAddressBalanceSolanaR() {
    }
    GetAddressBalanceSolanaR.getAttributeTypeMap = function () {
        return GetAddressBalanceSolanaR.attributeTypeMap;
    };
    GetAddressBalanceSolanaR.discriminator = undefined;
    GetAddressBalanceSolanaR.attributeTypeMap = [
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
            "type": "GetAddressBalanceSolanaRData"
        }
    ];
    return GetAddressBalanceSolanaR;
}());
exports.GetAddressBalanceSolanaR = GetAddressBalanceSolanaR;
//# sourceMappingURL=getAddressBalanceSolanaR.js.map