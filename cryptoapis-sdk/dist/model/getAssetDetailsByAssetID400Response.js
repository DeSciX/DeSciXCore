"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAssetDetailsByAssetID400Response = void 0;
var GetAssetDetailsByAssetID400Response = (function () {
    function GetAssetDetailsByAssetID400Response() {
    }
    GetAssetDetailsByAssetID400Response.getAttributeTypeMap = function () {
        return GetAssetDetailsByAssetID400Response.attributeTypeMap;
    };
    GetAssetDetailsByAssetID400Response.discriminator = undefined;
    GetAssetDetailsByAssetID400Response.attributeTypeMap = [
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
            "type": "GetAssetDetailsByAssetIDE400"
        }
    ];
    return GetAssetDetailsByAssetID400Response;
}());
exports.GetAssetDetailsByAssetID400Response = GetAssetDetailsByAssetID400Response;
//# sourceMappingURL=getAssetDetailsByAssetID400Response.js.map