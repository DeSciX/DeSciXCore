"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetFeeRecommendationsKASPAE400 = void 0;
var GetFeeRecommendationsKASPAE400 = (function () {
    function GetFeeRecommendationsKASPAE400() {
    }
    GetFeeRecommendationsKASPAE400.getAttributeTypeMap = function () {
        return GetFeeRecommendationsKASPAE400.attributeTypeMap;
    };
    GetFeeRecommendationsKASPAE400.discriminator = undefined;
    GetFeeRecommendationsKASPAE400.attributeTypeMap = [
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
    return GetFeeRecommendationsKASPAE400;
}());
exports.GetFeeRecommendationsKASPAE400 = GetFeeRecommendationsKASPAE400;
//# sourceMappingURL=getFeeRecommendationsKASPAE400.js.map