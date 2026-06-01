"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAddressBalanceEVM401Response = void 0;
var GetAddressBalanceEVM401Response = (function () {
    function GetAddressBalanceEVM401Response() {
    }
    GetAddressBalanceEVM401Response.getAttributeTypeMap = function () {
        return GetAddressBalanceEVM401Response.attributeTypeMap;
    };
    GetAddressBalanceEVM401Response.discriminator = undefined;
    GetAddressBalanceEVM401Response.attributeTypeMap = [
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
            "type": "GetAddressBalanceEVME401"
        }
    ];
    return GetAddressBalanceEVM401Response;
}());
exports.GetAddressBalanceEVM401Response = GetAddressBalanceEVM401Response;
//# sourceMappingURL=getAddressBalanceEVM401Response.js.map