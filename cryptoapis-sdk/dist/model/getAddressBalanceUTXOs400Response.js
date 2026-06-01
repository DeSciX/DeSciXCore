"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAddressBalanceUTXOs400Response = void 0;
var GetAddressBalanceUTXOs400Response = (function () {
    function GetAddressBalanceUTXOs400Response() {
    }
    GetAddressBalanceUTXOs400Response.getAttributeTypeMap = function () {
        return GetAddressBalanceUTXOs400Response.attributeTypeMap;
    };
    GetAddressBalanceUTXOs400Response.discriminator = undefined;
    GetAddressBalanceUTXOs400Response.attributeTypeMap = [
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
            "type": "GetAddressBalanceUTXOsE400"
        }
    ];
    return GetAddressBalanceUTXOs400Response;
}());
exports.GetAddressBalanceUTXOs400Response = GetAddressBalanceUTXOs400Response;
//# sourceMappingURL=getAddressBalanceUTXOs400Response.js.map