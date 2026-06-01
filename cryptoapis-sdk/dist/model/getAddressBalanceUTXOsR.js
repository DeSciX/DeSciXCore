"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAddressBalanceUTXOsR = void 0;
var GetAddressBalanceUTXOsR = (function () {
    function GetAddressBalanceUTXOsR() {
    }
    GetAddressBalanceUTXOsR.getAttributeTypeMap = function () {
        return GetAddressBalanceUTXOsR.attributeTypeMap;
    };
    GetAddressBalanceUTXOsR.discriminator = undefined;
    GetAddressBalanceUTXOsR.attributeTypeMap = [
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
            "type": "GetAddressBalanceUTXOsRData"
        }
    ];
    return GetAddressBalanceUTXOsR;
}());
exports.GetAddressBalanceUTXOsR = GetAddressBalanceUTXOsR;
//# sourceMappingURL=getAddressBalanceUTXOsR.js.map