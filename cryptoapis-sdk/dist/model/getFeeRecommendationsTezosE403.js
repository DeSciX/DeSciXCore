"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetFeeRecommendationsTezosE403 = void 0;
var GetFeeRecommendationsTezosE403 = (function () {
    function GetFeeRecommendationsTezosE403() {
    }
    GetFeeRecommendationsTezosE403.getAttributeTypeMap = function () {
        return GetFeeRecommendationsTezosE403.attributeTypeMap;
    };
    GetFeeRecommendationsTezosE403.discriminator = undefined;
    GetFeeRecommendationsTezosE403.attributeTypeMap = [
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
    return GetFeeRecommendationsTezosE403;
}());
exports.GetFeeRecommendationsTezosE403 = GetFeeRecommendationsTezosE403;
//# sourceMappingURL=getFeeRecommendationsTezosE403.js.map