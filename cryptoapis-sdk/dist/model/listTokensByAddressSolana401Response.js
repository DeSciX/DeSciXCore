"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTokensByAddressSolana401Response = void 0;
var ListTokensByAddressSolana401Response = (function () {
    function ListTokensByAddressSolana401Response() {
    }
    ListTokensByAddressSolana401Response.getAttributeTypeMap = function () {
        return ListTokensByAddressSolana401Response.attributeTypeMap;
    };
    ListTokensByAddressSolana401Response.discriminator = undefined;
    ListTokensByAddressSolana401Response.attributeTypeMap = [
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
            "type": "ListTokensByAddressSolanaE401"
        }
    ];
    return ListTokensByAddressSolana401Response;
}());
exports.ListTokensByAddressSolana401Response = ListTokensByAddressSolana401Response;
//# sourceMappingURL=listTokensByAddressSolana401Response.js.map