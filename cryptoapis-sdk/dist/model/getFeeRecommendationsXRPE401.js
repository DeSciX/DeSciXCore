"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetFeeRecommendationsXRPE401 = void 0;
var GetFeeRecommendationsXRPE401 = (function () {
    function GetFeeRecommendationsXRPE401() {
    }
    GetFeeRecommendationsXRPE401.getAttributeTypeMap = function () {
        return GetFeeRecommendationsXRPE401.attributeTypeMap;
    };
    GetFeeRecommendationsXRPE401.discriminator = undefined;
    GetFeeRecommendationsXRPE401.attributeTypeMap = [
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
    return GetFeeRecommendationsXRPE401;
}());
exports.GetFeeRecommendationsXRPE401 = GetFeeRecommendationsXRPE401;
//# sourceMappingURL=getFeeRecommendationsXRPE401.js.map