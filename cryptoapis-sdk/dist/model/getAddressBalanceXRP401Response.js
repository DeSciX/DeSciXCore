"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAddressBalanceXRP401Response = void 0;
var GetAddressBalanceXRP401Response = (function () {
    function GetAddressBalanceXRP401Response() {
    }
    GetAddressBalanceXRP401Response.getAttributeTypeMap = function () {
        return GetAddressBalanceXRP401Response.attributeTypeMap;
    };
    GetAddressBalanceXRP401Response.discriminator = undefined;
    GetAddressBalanceXRP401Response.attributeTypeMap = [
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
            "type": "GetAddressBalanceXRPE401"
        }
    ];
    return GetAddressBalanceXRP401Response;
}());
exports.GetAddressBalanceXRP401Response = GetAddressBalanceXRP401Response;
//# sourceMappingURL=getAddressBalanceXRP401Response.js.map