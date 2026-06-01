"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAddressBalanceUTXOs401Response = void 0;
var GetAddressBalanceUTXOs401Response = (function () {
    function GetAddressBalanceUTXOs401Response() {
    }
    GetAddressBalanceUTXOs401Response.getAttributeTypeMap = function () {
        return GetAddressBalanceUTXOs401Response.attributeTypeMap;
    };
    GetAddressBalanceUTXOs401Response.discriminator = undefined;
    GetAddressBalanceUTXOs401Response.attributeTypeMap = [
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
            "type": "GetAddressBalanceUTXOsE401"
        }
    ];
    return GetAddressBalanceUTXOs401Response;
}());
exports.GetAddressBalanceUTXOs401Response = GetAddressBalanceUTXOs401Response;
//# sourceMappingURL=getAddressBalanceUTXOs401Response.js.map