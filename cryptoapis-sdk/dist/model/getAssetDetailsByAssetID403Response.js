"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAssetDetailsByAssetID403Response = void 0;
var GetAssetDetailsByAssetID403Response = (function () {
    function GetAssetDetailsByAssetID403Response() {
    }
    GetAssetDetailsByAssetID403Response.getAttributeTypeMap = function () {
        return GetAssetDetailsByAssetID403Response.attributeTypeMap;
    };
    GetAssetDetailsByAssetID403Response.discriminator = undefined;
    GetAssetDetailsByAssetID403Response.attributeTypeMap = [
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
            "type": "GetAssetDetailsByAssetIDE403"
        }
    ];
    return GetAssetDetailsByAssetID403Response;
}());
exports.GetAssetDetailsByAssetID403Response = GetAssetDetailsByAssetID403Response;
//# sourceMappingURL=getAssetDetailsByAssetID403Response.js.map