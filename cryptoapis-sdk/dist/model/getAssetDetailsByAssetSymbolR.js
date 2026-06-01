"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAssetDetailsByAssetSymbolR = void 0;
var GetAssetDetailsByAssetSymbolR = (function () {
    function GetAssetDetailsByAssetSymbolR() {
    }
    GetAssetDetailsByAssetSymbolR.getAttributeTypeMap = function () {
        return GetAssetDetailsByAssetSymbolR.attributeTypeMap;
    };
    GetAssetDetailsByAssetSymbolR.discriminator = undefined;
    GetAssetDetailsByAssetSymbolR.attributeTypeMap = [
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
            "name": "data",
            "baseName": "data",
            "type": "GetAssetDetailsByAssetSymbolRData"
        }
    ];
    return GetAssetDetailsByAssetSymbolR;
}());
exports.GetAssetDetailsByAssetSymbolR = GetAssetDetailsByAssetSymbolR;
//# sourceMappingURL=getAssetDetailsByAssetSymbolR.js.map