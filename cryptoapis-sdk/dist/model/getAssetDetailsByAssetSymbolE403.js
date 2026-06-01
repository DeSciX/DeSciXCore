"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAssetDetailsByAssetSymbolE403 = void 0;
var GetAssetDetailsByAssetSymbolE403 = (function () {
    function GetAssetDetailsByAssetSymbolE403() {
    }
    GetAssetDetailsByAssetSymbolE403.getAttributeTypeMap = function () {
        return GetAssetDetailsByAssetSymbolE403.attributeTypeMap;
    };
    GetAssetDetailsByAssetSymbolE403.discriminator = undefined;
    GetAssetDetailsByAssetSymbolE403.attributeTypeMap = [
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
    return GetAssetDetailsByAssetSymbolE403;
}());
exports.GetAssetDetailsByAssetSymbolE403 = GetAssetDetailsByAssetSymbolE403;
//# sourceMappingURL=getAssetDetailsByAssetSymbolE403.js.map