"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetFeeRecommendationsUTXOsE400 = void 0;
var GetFeeRecommendationsUTXOsE400 = (function () {
    function GetFeeRecommendationsUTXOsE400() {
    }
    GetFeeRecommendationsUTXOsE400.getAttributeTypeMap = function () {
        return GetFeeRecommendationsUTXOsE400.attributeTypeMap;
    };
    GetFeeRecommendationsUTXOsE400.discriminator = undefined;
    GetFeeRecommendationsUTXOsE400.attributeTypeMap = [
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
    return GetFeeRecommendationsUTXOsE400;
}());
exports.GetFeeRecommendationsUTXOsE400 = GetFeeRecommendationsUTXOsE400;
//# sourceMappingURL=getFeeRecommendationsUTXOsE400.js.map