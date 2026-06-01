"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetFeeRecommendationsKASPAE401 = void 0;
var GetFeeRecommendationsKASPAE401 = (function () {
    function GetFeeRecommendationsKASPAE401() {
    }
    GetFeeRecommendationsKASPAE401.getAttributeTypeMap = function () {
        return GetFeeRecommendationsKASPAE401.attributeTypeMap;
    };
    GetFeeRecommendationsKASPAE401.discriminator = undefined;
    GetFeeRecommendationsKASPAE401.attributeTypeMap = [
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
    return GetFeeRecommendationsKASPAE401;
}());
exports.GetFeeRecommendationsKASPAE401 = GetFeeRecommendationsKASPAE401;
//# sourceMappingURL=getFeeRecommendationsKASPAE401.js.map