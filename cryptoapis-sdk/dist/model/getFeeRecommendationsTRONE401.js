"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetFeeRecommendationsTRONE401 = void 0;
var GetFeeRecommendationsTRONE401 = (function () {
    function GetFeeRecommendationsTRONE401() {
    }
    GetFeeRecommendationsTRONE401.getAttributeTypeMap = function () {
        return GetFeeRecommendationsTRONE401.attributeTypeMap;
    };
    GetFeeRecommendationsTRONE401.discriminator = undefined;
    GetFeeRecommendationsTRONE401.attributeTypeMap = [
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
    return GetFeeRecommendationsTRONE401;
}());
exports.GetFeeRecommendationsTRONE401 = GetFeeRecommendationsTRONE401;
//# sourceMappingURL=getFeeRecommendationsTRONE401.js.map