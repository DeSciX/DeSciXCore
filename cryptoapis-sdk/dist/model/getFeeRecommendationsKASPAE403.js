"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetFeeRecommendationsKASPAE403 = void 0;
var GetFeeRecommendationsKASPAE403 = (function () {
    function GetFeeRecommendationsKASPAE403() {
    }
    GetFeeRecommendationsKASPAE403.getAttributeTypeMap = function () {
        return GetFeeRecommendationsKASPAE403.attributeTypeMap;
    };
    GetFeeRecommendationsKASPAE403.discriminator = undefined;
    GetFeeRecommendationsKASPAE403.attributeTypeMap = [
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
    return GetFeeRecommendationsKASPAE403;
}());
exports.GetFeeRecommendationsKASPAE403 = GetFeeRecommendationsKASPAE403;
//# sourceMappingURL=getFeeRecommendationsKASPAE403.js.map