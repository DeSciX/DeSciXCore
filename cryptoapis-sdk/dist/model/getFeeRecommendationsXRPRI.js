"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetFeeRecommendationsXRPRI = void 0;
var GetFeeRecommendationsXRPRI = (function () {
    function GetFeeRecommendationsXRPRI() {
    }
    GetFeeRecommendationsXRPRI.getAttributeTypeMap = function () {
        return GetFeeRecommendationsXRPRI.attributeTypeMap;
    };
    GetFeeRecommendationsXRPRI.discriminator = undefined;
    GetFeeRecommendationsXRPRI.attributeTypeMap = [
        {
            "name": "fast",
            "baseName": "fast",
            "type": "string"
        },
        {
            "name": "feeCushionMultiplier",
            "baseName": "feeCushionMultiplier",
            "type": "string"
        },
        {
            "name": "slow",
            "baseName": "slow",
            "type": "string"
        },
        {
            "name": "standard",
            "baseName": "standard",
            "type": "string"
        },
        {
            "name": "unit",
            "baseName": "unit",
            "type": "string"
        }
    ];
    return GetFeeRecommendationsXRPRI;
}());
exports.GetFeeRecommendationsXRPRI = GetFeeRecommendationsXRPRI;
//# sourceMappingURL=getFeeRecommendationsXRPRI.js.map