"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAddressBalanceSolana400Response = void 0;
var GetAddressBalanceSolana400Response = (function () {
    function GetAddressBalanceSolana400Response() {
    }
    GetAddressBalanceSolana400Response.getAttributeTypeMap = function () {
        return GetAddressBalanceSolana400Response.attributeTypeMap;
    };
    GetAddressBalanceSolana400Response.discriminator = undefined;
    GetAddressBalanceSolana400Response.attributeTypeMap = [
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
            "type": "GetAddressBalanceSolanaE400"
        }
    ];
    return GetAddressBalanceSolana400Response;
}());
exports.GetAddressBalanceSolana400Response = GetAddressBalanceSolana400Response;
//# sourceMappingURL=getAddressBalanceSolana400Response.js.map