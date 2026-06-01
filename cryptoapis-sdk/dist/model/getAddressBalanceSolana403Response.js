"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAddressBalanceSolana403Response = void 0;
var GetAddressBalanceSolana403Response = (function () {
    function GetAddressBalanceSolana403Response() {
    }
    GetAddressBalanceSolana403Response.getAttributeTypeMap = function () {
        return GetAddressBalanceSolana403Response.attributeTypeMap;
    };
    GetAddressBalanceSolana403Response.discriminator = undefined;
    GetAddressBalanceSolana403Response.attributeTypeMap = [
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
            "type": "GetAddressBalanceSolanaE403"
        }
    ];
    return GetAddressBalanceSolana403Response;
}());
exports.GetAddressBalanceSolana403Response = GetAddressBalanceSolana403Response;
//# sourceMappingURL=getAddressBalanceSolana403Response.js.map