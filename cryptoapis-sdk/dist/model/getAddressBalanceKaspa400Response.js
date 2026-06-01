"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAddressBalanceKaspa400Response = void 0;
var GetAddressBalanceKaspa400Response = (function () {
    function GetAddressBalanceKaspa400Response() {
    }
    GetAddressBalanceKaspa400Response.getAttributeTypeMap = function () {
        return GetAddressBalanceKaspa400Response.attributeTypeMap;
    };
    GetAddressBalanceKaspa400Response.discriminator = undefined;
    GetAddressBalanceKaspa400Response.attributeTypeMap = [
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
            "type": "GetAddressBalanceKaspaE400"
        }
    ];
    return GetAddressBalanceKaspa400Response;
}());
exports.GetAddressBalanceKaspa400Response = GetAddressBalanceKaspa400Response;
//# sourceMappingURL=getAddressBalanceKaspa400Response.js.map