"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetFeeRecommendationsXRPE400 = void 0;
var GetFeeRecommendationsXRPE400 = (function () {
    function GetFeeRecommendationsXRPE400() {
    }
    GetFeeRecommendationsXRPE400.getAttributeTypeMap = function () {
        return GetFeeRecommendationsXRPE400.attributeTypeMap;
    };
    GetFeeRecommendationsXRPE400.discriminator = undefined;
    GetFeeRecommendationsXRPE400.attributeTypeMap = [
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
    return GetFeeRecommendationsXRPE400;
}());
exports.GetFeeRecommendationsXRPE400 = GetFeeRecommendationsXRPE400;
//# sourceMappingURL=getFeeRecommendationsXRPE400.js.map