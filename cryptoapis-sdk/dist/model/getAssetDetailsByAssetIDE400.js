"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAssetDetailsByAssetIDE400 = void 0;
var GetAssetDetailsByAssetIDE400 = (function () {
    function GetAssetDetailsByAssetIDE400() {
    }
    GetAssetDetailsByAssetIDE400.getAttributeTypeMap = function () {
        return GetAssetDetailsByAssetIDE400.attributeTypeMap;
    };
    GetAssetDetailsByAssetIDE400.discriminator = undefined;
    GetAssetDetailsByAssetIDE400.attributeTypeMap = [
        {
            "name": "code",
            "baseName": "code",
            "type": "string"
        },
        {
            "name": "message",
            "baseName": "message",
            "type": "string"
        },
        {
            "name": "details",
            "baseName": "details",
            "type": "Array<BannedIpAddressDetailsInner>"
        }
    ];
    return GetAssetDetailsByAssetIDE400;
}());
exports.GetAssetDetailsByAssetIDE400 = GetAssetDetailsByAssetIDE400;
//# sourceMappingURL=getAssetDetailsByAssetIDE400.js.map