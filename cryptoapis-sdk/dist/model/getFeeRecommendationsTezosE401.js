"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetFeeRecommendationsTezosE401 = void 0;
var GetFeeRecommendationsTezosE401 = (function () {
    function GetFeeRecommendationsTezosE401() {
    }
    GetFeeRecommendationsTezosE401.getAttributeTypeMap = function () {
        return GetFeeRecommendationsTezosE401.attributeTypeMap;
    };
    GetFeeRecommendationsTezosE401.discriminator = undefined;
    GetFeeRecommendationsTezosE401.attributeTypeMap = [
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
    return GetFeeRecommendationsTezosE401;
}());
exports.GetFeeRecommendationsTezosE401 = GetFeeRecommendationsTezosE401;
//# sourceMappingURL=getFeeRecommendationsTezosE401.js.map