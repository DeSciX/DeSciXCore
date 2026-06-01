"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetFeeRecommendationsXRPE403 = void 0;
var GetFeeRecommendationsXRPE403 = (function () {
    function GetFeeRecommendationsXRPE403() {
    }
    GetFeeRecommendationsXRPE403.getAttributeTypeMap = function () {
        return GetFeeRecommendationsXRPE403.attributeTypeMap;
    };
    GetFeeRecommendationsXRPE403.discriminator = undefined;
    GetFeeRecommendationsXRPE403.attributeTypeMap = [
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
    return GetFeeRecommendationsXRPE403;
}());
exports.GetFeeRecommendationsXRPE403 = GetFeeRecommendationsXRPE403;
//# sourceMappingURL=getFeeRecommendationsXRPE403.js.map