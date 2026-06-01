"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAddressBalanceKaspa403Response = void 0;
var GetAddressBalanceKaspa403Response = (function () {
    function GetAddressBalanceKaspa403Response() {
    }
    GetAddressBalanceKaspa403Response.getAttributeTypeMap = function () {
        return GetAddressBalanceKaspa403Response.attributeTypeMap;
    };
    GetAddressBalanceKaspa403Response.discriminator = undefined;
    GetAddressBalanceKaspa403Response.attributeTypeMap = [
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
            "type": "GetAddressBalanceKaspaE403"
        }
    ];
    return GetAddressBalanceKaspa403Response;
}());
exports.GetAddressBalanceKaspa403Response = GetAddressBalanceKaspa403Response;
//# sourceMappingURL=getAddressBalanceKaspa403Response.js.map