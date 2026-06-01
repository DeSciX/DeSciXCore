"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListSupportedAssets400Response = void 0;
var ListSupportedAssets400Response = (function () {
    function ListSupportedAssets400Response() {
    }
    ListSupportedAssets400Response.getAttributeTypeMap = function () {
        return ListSupportedAssets400Response.attributeTypeMap;
    };
    ListSupportedAssets400Response.discriminator = undefined;
    ListSupportedAssets400Response.attributeTypeMap = [
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
            "type": "ListSupportedAssetsE400"
        }
    ];
    return ListSupportedAssets400Response;
}());
exports.ListSupportedAssets400Response = ListSupportedAssets400Response;
//# sourceMappingURL=listSupportedAssets400Response.js.map