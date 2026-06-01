"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAssetDetailsByAssetIDE401 = void 0;
var GetAssetDetailsByAssetIDE401 = (function () {
    function GetAssetDetailsByAssetIDE401() {
    }
    GetAssetDetailsByAssetIDE401.getAttributeTypeMap = function () {
        return GetAssetDetailsByAssetIDE401.attributeTypeMap;
    };
    GetAssetDetailsByAssetIDE401.discriminator = undefined;
    GetAssetDetailsByAssetIDE401.attributeTypeMap = [
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
    return GetAssetDetailsByAssetIDE401;
}());
exports.GetAssetDetailsByAssetIDE401 = GetAssetDetailsByAssetIDE401;
//# sourceMappingURL=getAssetDetailsByAssetIDE401.js.map