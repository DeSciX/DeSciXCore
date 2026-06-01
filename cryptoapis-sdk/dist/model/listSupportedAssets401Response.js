"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListSupportedAssets401Response = void 0;
var ListSupportedAssets401Response = (function () {
    function ListSupportedAssets401Response() {
    }
    ListSupportedAssets401Response.getAttributeTypeMap = function () {
        return ListSupportedAssets401Response.attributeTypeMap;
    };
    ListSupportedAssets401Response.discriminator = undefined;
    ListSupportedAssets401Response.attributeTypeMap = [
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
            "type": "ListSupportedAssetsE401"
        }
    ];
    return ListSupportedAssets401Response;
}());
exports.ListSupportedAssets401Response = ListSupportedAssets401Response;
//# sourceMappingURL=listSupportedAssets401Response.js.map