"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAddressBalanceKaspa401Response = void 0;
var GetAddressBalanceKaspa401Response = (function () {
    function GetAddressBalanceKaspa401Response() {
    }
    GetAddressBalanceKaspa401Response.getAttributeTypeMap = function () {
        return GetAddressBalanceKaspa401Response.attributeTypeMap;
    };
    GetAddressBalanceKaspa401Response.discriminator = undefined;
    GetAddressBalanceKaspa401Response.attributeTypeMap = [
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
            "type": "GetAddressBalanceKaspaE401"
        }
    ];
    return GetAddressBalanceKaspa401Response;
}());
exports.GetAddressBalanceKaspa401Response = GetAddressBalanceKaspa401Response;
//# sourceMappingURL=getAddressBalanceKaspa401Response.js.map