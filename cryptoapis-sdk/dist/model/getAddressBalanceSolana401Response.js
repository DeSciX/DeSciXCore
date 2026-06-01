"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAddressBalanceSolana401Response = void 0;
var GetAddressBalanceSolana401Response = (function () {
    function GetAddressBalanceSolana401Response() {
    }
    GetAddressBalanceSolana401Response.getAttributeTypeMap = function () {
        return GetAddressBalanceSolana401Response.attributeTypeMap;
    };
    GetAddressBalanceSolana401Response.discriminator = undefined;
    GetAddressBalanceSolana401Response.attributeTypeMap = [
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
            "type": "GetAddressBalanceSolanaE401"
        }
    ];
    return GetAddressBalanceSolana401Response;
}());
exports.GetAddressBalanceSolana401Response = GetAddressBalanceSolana401Response;
//# sourceMappingURL=getAddressBalanceSolana401Response.js.map