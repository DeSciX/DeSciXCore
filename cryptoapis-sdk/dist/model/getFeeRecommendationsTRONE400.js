"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetFeeRecommendationsTRONE400 = void 0;
var GetFeeRecommendationsTRONE400 = (function () {
    function GetFeeRecommendationsTRONE400() {
    }
    GetFeeRecommendationsTRONE400.getAttributeTypeMap = function () {
        return GetFeeRecommendationsTRONE400.attributeTypeMap;
    };
    GetFeeRecommendationsTRONE400.discriminator = undefined;
    GetFeeRecommendationsTRONE400.attributeTypeMap = [
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
    return GetFeeRecommendationsTRONE400;
}());
exports.GetFeeRecommendationsTRONE400 = GetFeeRecommendationsTRONE400;
//# sourceMappingURL=getFeeRecommendationsTRONE400.js.map