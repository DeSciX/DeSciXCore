"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAssetDetailsByAssetSymbol403Response = void 0;
var GetAssetDetailsByAssetSymbol403Response = (function () {
    function GetAssetDetailsByAssetSymbol403Response() {
    }
    GetAssetDetailsByAssetSymbol403Response.getAttributeTypeMap = function () {
        return GetAssetDetailsByAssetSymbol403Response.attributeTypeMap;
    };
    GetAssetDetailsByAssetSymbol403Response.discriminator = undefined;
    GetAssetDetailsByAssetSymbol403Response.attributeTypeMap = [
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
            "type": "GetAssetDetailsByAssetSymbolE403"
        }
    ];
    return GetAssetDetailsByAssetSymbol403Response;
}());
exports.GetAssetDetailsByAssetSymbol403Response = GetAssetDetailsByAssetSymbol403Response;
//# sourceMappingURL=getAssetDetailsByAssetSymbol403Response.js.map