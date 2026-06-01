"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTokensByAddressSolana403Response = void 0;
var ListTokensByAddressSolana403Response = (function () {
    function ListTokensByAddressSolana403Response() {
    }
    ListTokensByAddressSolana403Response.getAttributeTypeMap = function () {
        return ListTokensByAddressSolana403Response.attributeTypeMap;
    };
    ListTokensByAddressSolana403Response.discriminator = undefined;
    ListTokensByAddressSolana403Response.attributeTypeMap = [
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
            "type": "ListTokensByAddressSolanaE403"
        }
    ];
    return ListTokensByAddressSolana403Response;
}());
exports.ListTokensByAddressSolana403Response = ListTokensByAddressSolana403Response;
//# sourceMappingURL=listTokensByAddressSolana403Response.js.map