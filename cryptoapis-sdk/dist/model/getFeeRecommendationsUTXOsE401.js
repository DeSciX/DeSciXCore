"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetFeeRecommendationsUTXOsE401 = void 0;
var GetFeeRecommendationsUTXOsE401 = (function () {
    function GetFeeRecommendationsUTXOsE401() {
    }
    GetFeeRecommendationsUTXOsE401.getAttributeTypeMap = function () {
        return GetFeeRecommendationsUTXOsE401.attributeTypeMap;
    };
    GetFeeRecommendationsUTXOsE401.discriminator = undefined;
    GetFeeRecommendationsUTXOsE401.attributeTypeMap = [
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
    return GetFeeRecommendationsUTXOsE401;
}());
exports.GetFeeRecommendationsUTXOsE401 = GetFeeRecommendationsUTXOsE401;
//# sourceMappingURL=getFeeRecommendationsUTXOsE401.js.map