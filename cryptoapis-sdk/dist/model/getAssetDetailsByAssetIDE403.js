"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAssetDetailsByAssetIDE403 = void 0;
var GetAssetDetailsByAssetIDE403 = (function () {
    function GetAssetDetailsByAssetIDE403() {
    }
    GetAssetDetailsByAssetIDE403.getAttributeTypeMap = function () {
        return GetAssetDetailsByAssetIDE403.attributeTypeMap;
    };
    GetAssetDetailsByAssetIDE403.discriminator = undefined;
    GetAssetDetailsByAssetIDE403.attributeTypeMap = [
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
    return GetAssetDetailsByAssetIDE403;
}());
exports.GetAssetDetailsByAssetIDE403 = GetAssetDetailsByAssetIDE403;
//# sourceMappingURL=getAssetDetailsByAssetIDE403.js.map