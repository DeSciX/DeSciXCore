"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAddressBalanceXRP400Response = void 0;
var GetAddressBalanceXRP400Response = (function () {
    function GetAddressBalanceXRP400Response() {
    }
    GetAddressBalanceXRP400Response.getAttributeTypeMap = function () {
        return GetAddressBalanceXRP400Response.attributeTypeMap;
    };
    GetAddressBalanceXRP400Response.discriminator = undefined;
    GetAddressBalanceXRP400Response.attributeTypeMap = [
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
            "type": "GetAddressBalanceXRPE400"
        }
    ];
    return GetAddressBalanceXRP400Response;
}());
exports.GetAddressBalanceXRP400Response = GetAddressBalanceXRP400Response;
//# sourceMappingURL=getAddressBalanceXRP400Response.js.map