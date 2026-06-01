"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAssetDetailsByAssetIDR = void 0;
var GetAssetDetailsByAssetIDR = (function () {
    function GetAssetDetailsByAssetIDR() {
    }
    GetAssetDetailsByAssetIDR.getAttributeTypeMap = function () {
        return GetAssetDetailsByAssetIDR.attributeTypeMap;
    };
    GetAssetDetailsByAssetIDR.discriminator = undefined;
    GetAssetDetailsByAssetIDR.attributeTypeMap = [
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
            "type": "GetAssetDetailsByAssetIDRData"
        }
    ];
    return GetAssetDetailsByAssetIDR;
}());
exports.GetAssetDetailsByAssetIDR = GetAssetDetailsByAssetIDR;
//# sourceMappingURL=getAssetDetailsByAssetIDR.js.map