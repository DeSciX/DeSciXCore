"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetFeeRecommendationsTezosE400 = void 0;
var GetFeeRecommendationsTezosE400 = (function () {
    function GetFeeRecommendationsTezosE400() {
    }
    GetFeeRecommendationsTezosE400.getAttributeTypeMap = function () {
        return GetFeeRecommendationsTezosE400.attributeTypeMap;
    };
    GetFeeRecommendationsTezosE400.discriminator = undefined;
    GetFeeRecommendationsTezosE400.attributeTypeMap = [
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
    return GetFeeRecommendationsTezosE400;
}());
exports.GetFeeRecommendationsTezosE400 = GetFeeRecommendationsTezosE400;
//# sourceMappingURL=getFeeRecommendationsTezosE400.js.map