"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetFeeRecommendationsTRONE403 = void 0;
var GetFeeRecommendationsTRONE403 = (function () {
    function GetFeeRecommendationsTRONE403() {
    }
    GetFeeRecommendationsTRONE403.getAttributeTypeMap = function () {
        return GetFeeRecommendationsTRONE403.attributeTypeMap;
    };
    GetFeeRecommendationsTRONE403.discriminator = undefined;
    GetFeeRecommendationsTRONE403.attributeTypeMap = [
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
    return GetFeeRecommendationsTRONE403;
}());
exports.GetFeeRecommendationsTRONE403 = GetFeeRecommendationsTRONE403;
//# sourceMappingURL=getFeeRecommendationsTRONE403.js.map