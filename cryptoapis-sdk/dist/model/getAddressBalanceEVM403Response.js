"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAddressBalanceEVM403Response = void 0;
var GetAddressBalanceEVM403Response = (function () {
    function GetAddressBalanceEVM403Response() {
    }
    GetAddressBalanceEVM403Response.getAttributeTypeMap = function () {
        return GetAddressBalanceEVM403Response.attributeTypeMap;
    };
    GetAddressBalanceEVM403Response.discriminator = undefined;
    GetAddressBalanceEVM403Response.attributeTypeMap = [
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
            "type": "GetAddressBalanceEVME403"
        }
    ];
    return GetAddressBalanceEVM403Response;
}());
exports.GetAddressBalanceEVM403Response = GetAddressBalanceEVM403Response;
//# sourceMappingURL=getAddressBalanceEVM403Response.js.map