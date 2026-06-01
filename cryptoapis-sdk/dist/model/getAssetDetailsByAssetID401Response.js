"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAssetDetailsByAssetID401Response = void 0;
var GetAssetDetailsByAssetID401Response = (function () {
    function GetAssetDetailsByAssetID401Response() {
    }
    GetAssetDetailsByAssetID401Response.getAttributeTypeMap = function () {
        return GetAssetDetailsByAssetID401Response.attributeTypeMap;
    };
    GetAssetDetailsByAssetID401Response.discriminator = undefined;
    GetAssetDetailsByAssetID401Response.attributeTypeMap = [
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
            "type": "GetAssetDetailsByAssetIDE401"
        }
    ];
    return GetAssetDetailsByAssetID401Response;
}());
exports.GetAssetDetailsByAssetID401Response = GetAssetDetailsByAssetID401Response;
//# sourceMappingURL=getAssetDetailsByAssetID401Response.js.map