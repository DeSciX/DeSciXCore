"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAddressBalanceEVM400Response = void 0;
var GetAddressBalanceEVM400Response = (function () {
    function GetAddressBalanceEVM400Response() {
    }
    GetAddressBalanceEVM400Response.getAttributeTypeMap = function () {
        return GetAddressBalanceEVM400Response.attributeTypeMap;
    };
    GetAddressBalanceEVM400Response.discriminator = undefined;
    GetAddressBalanceEVM400Response.attributeTypeMap = [
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
            "type": "GetAddressBalanceEVME400"
        }
    ];
    return GetAddressBalanceEVM400Response;
}());
exports.GetAddressBalanceEVM400Response = GetAddressBalanceEVM400Response;
//# sourceMappingURL=getAddressBalanceEVM400Response.js.map