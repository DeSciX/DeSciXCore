"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAssetDetailsByAssetSymbol401Response = void 0;
var GetAssetDetailsByAssetSymbol401Response = (function () {
    function GetAssetDetailsByAssetSymbol401Response() {
    }
    GetAssetDetailsByAssetSymbol401Response.getAttributeTypeMap = function () {
        return GetAssetDetailsByAssetSymbol401Response.attributeTypeMap;
    };
    GetAssetDetailsByAssetSymbol401Response.discriminator = undefined;
    GetAssetDetailsByAssetSymbol401Response.attributeTypeMap = [
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
            "type": "GetAssetDetailsByAssetSymbolE401"
        }
    ];
    return GetAssetDetailsByAssetSymbol401Response;
}());
exports.GetAssetDetailsByAssetSymbol401Response = GetAssetDetailsByAssetSymbol401Response;
//# sourceMappingURL=getAssetDetailsByAssetSymbol401Response.js.map