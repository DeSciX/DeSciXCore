"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListSupportedAssets403Response = void 0;
var ListSupportedAssets403Response = (function () {
    function ListSupportedAssets403Response() {
    }
    ListSupportedAssets403Response.getAttributeTypeMap = function () {
        return ListSupportedAssets403Response.attributeTypeMap;
    };
    ListSupportedAssets403Response.discriminator = undefined;
    ListSupportedAssets403Response.attributeTypeMap = [
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
            "type": "ListSupportedAssetsE403"
        }
    ];
    return ListSupportedAssets403Response;
}());
exports.ListSupportedAssets403Response = ListSupportedAssets403Response;
//# sourceMappingURL=listSupportedAssets403Response.js.map