"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAssetDetailsByAssetSymbolE400 = void 0;
var GetAssetDetailsByAssetSymbolE400 = (function () {
    function GetAssetDetailsByAssetSymbolE400() {
    }
    GetAssetDetailsByAssetSymbolE400.getAttributeTypeMap = function () {
        return GetAssetDetailsByAssetSymbolE400.attributeTypeMap;
    };
    GetAssetDetailsByAssetSymbolE400.discriminator = undefined;
    GetAssetDetailsByAssetSymbolE400.attributeTypeMap = [
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
    return GetAssetDetailsByAssetSymbolE400;
}());
exports.GetAssetDetailsByAssetSymbolE400 = GetAssetDetailsByAssetSymbolE400;
//# sourceMappingURL=getAssetDetailsByAssetSymbolE400.js.map