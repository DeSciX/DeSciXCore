"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAddressBalanceXRP403Response = void 0;
var GetAddressBalanceXRP403Response = (function () {
    function GetAddressBalanceXRP403Response() {
    }
    GetAddressBalanceXRP403Response.getAttributeTypeMap = function () {
        return GetAddressBalanceXRP403Response.attributeTypeMap;
    };
    GetAddressBalanceXRP403Response.discriminator = undefined;
    GetAddressBalanceXRP403Response.attributeTypeMap = [
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
            "type": "GetAddressBalanceXRPE403"
        }
    ];
    return GetAddressBalanceXRP403Response;
}());
exports.GetAddressBalanceXRP403Response = GetAddressBalanceXRP403Response;
//# sourceMappingURL=getAddressBalanceXRP403Response.js.map