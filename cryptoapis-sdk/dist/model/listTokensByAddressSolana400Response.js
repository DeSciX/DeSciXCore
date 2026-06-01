"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTokensByAddressSolana400Response = void 0;
var ListTokensByAddressSolana400Response = (function () {
    function ListTokensByAddressSolana400Response() {
    }
    ListTokensByAddressSolana400Response.getAttributeTypeMap = function () {
        return ListTokensByAddressSolana400Response.attributeTypeMap;
    };
    ListTokensByAddressSolana400Response.discriminator = undefined;
    ListTokensByAddressSolana400Response.attributeTypeMap = [
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
            "type": "ListTokensByAddressSolanaE400"
        }
    ];
    return ListTokensByAddressSolana400Response;
}());
exports.ListTokensByAddressSolana400Response = ListTokensByAddressSolana400Response;
//# sourceMappingURL=listTokensByAddressSolana400Response.js.map