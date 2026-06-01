"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAddressBalanceUTXOs403Response = void 0;
var GetAddressBalanceUTXOs403Response = (function () {
    function GetAddressBalanceUTXOs403Response() {
    }
    GetAddressBalanceUTXOs403Response.getAttributeTypeMap = function () {
        return GetAddressBalanceUTXOs403Response.attributeTypeMap;
    };
    GetAddressBalanceUTXOs403Response.discriminator = undefined;
    GetAddressBalanceUTXOs403Response.attributeTypeMap = [
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
            "type": "GetAddressBalanceUTXOsE403"
        }
    ];
    return GetAddressBalanceUTXOs403Response;
}());
exports.GetAddressBalanceUTXOs403Response = GetAddressBalanceUTXOs403Response;
//# sourceMappingURL=getAddressBalanceUTXOs403Response.js.map