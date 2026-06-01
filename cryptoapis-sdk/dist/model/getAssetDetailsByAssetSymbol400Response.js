"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAssetDetailsByAssetSymbol400Response = void 0;
var GetAssetDetailsByAssetSymbol400Response = (function () {
    function GetAssetDetailsByAssetSymbol400Response() {
    }
    GetAssetDetailsByAssetSymbol400Response.getAttributeTypeMap = function () {
        return GetAssetDetailsByAssetSymbol400Response.attributeTypeMap;
    };
    GetAssetDetailsByAssetSymbol400Response.discriminator = undefined;
    GetAssetDetailsByAssetSymbol400Response.attributeTypeMap = [
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
            "type": "GetAssetDetailsByAssetSymbolE400"
        }
    ];
    return GetAssetDetailsByAssetSymbol400Response;
}());
exports.GetAssetDetailsByAssetSymbol400Response = GetAssetDetailsByAssetSymbol400Response;
//# sourceMappingURL=getAssetDetailsByAssetSymbol400Response.js.map