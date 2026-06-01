"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAssetDetailsByAssetSymbolE401 = void 0;
var GetAssetDetailsByAssetSymbolE401 = (function () {
    function GetAssetDetailsByAssetSymbolE401() {
    }
    GetAssetDetailsByAssetSymbolE401.getAttributeTypeMap = function () {
        return GetAssetDetailsByAssetSymbolE401.attributeTypeMap;
    };
    GetAssetDetailsByAssetSymbolE401.discriminator = undefined;
    GetAssetDetailsByAssetSymbolE401.attributeTypeMap = [
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
    return GetAssetDetailsByAssetSymbolE401;
}());
exports.GetAssetDetailsByAssetSymbolE401 = GetAssetDetailsByAssetSymbolE401;
//# sourceMappingURL=getAssetDetailsByAssetSymbolE401.js.map