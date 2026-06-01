"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAddressBalanceKaspaR = void 0;
var GetAddressBalanceKaspaR = (function () {
    function GetAddressBalanceKaspaR() {
    }
    GetAddressBalanceKaspaR.getAttributeTypeMap = function () {
        return GetAddressBalanceKaspaR.attributeTypeMap;
    };
    GetAddressBalanceKaspaR.discriminator = undefined;
    GetAddressBalanceKaspaR.attributeTypeMap = [
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
            "type": "GetAddressBalanceKaspaRData"
        }
    ];
    return GetAddressBalanceKaspaR;
}());
exports.GetAddressBalanceKaspaR = GetAddressBalanceKaspaR;
//# sourceMappingURL=getAddressBalanceKaspaR.js.map