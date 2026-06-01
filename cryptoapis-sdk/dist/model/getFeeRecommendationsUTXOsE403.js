"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetFeeRecommendationsUTXOsE403 = void 0;
var GetFeeRecommendationsUTXOsE403 = (function () {
    function GetFeeRecommendationsUTXOsE403() {
    }
    GetFeeRecommendationsUTXOsE403.getAttributeTypeMap = function () {
        return GetFeeRecommendationsUTXOsE403.attributeTypeMap;
    };
    GetFeeRecommendationsUTXOsE403.discriminator = undefined;
    GetFeeRecommendationsUTXOsE403.attributeTypeMap = [
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
    return GetFeeRecommendationsUTXOsE403;
}());
exports.GetFeeRecommendationsUTXOsE403 = GetFeeRecommendationsUTXOsE403;
//# sourceMappingURL=getFeeRecommendationsUTXOsE403.js.map