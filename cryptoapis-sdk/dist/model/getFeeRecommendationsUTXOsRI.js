"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetFeeRecommendationsUTXOsRI = void 0;
var GetFeeRecommendationsUTXOsRI = (function () {
    function GetFeeRecommendationsUTXOsRI() {
    }
    GetFeeRecommendationsUTXOsRI.getAttributeTypeMap = function () {
        return GetFeeRecommendationsUTXOsRI.attributeTypeMap;
    };
    GetFeeRecommendationsUTXOsRI.discriminator = undefined;
    GetFeeRecommendationsUTXOsRI.attributeTypeMap = [
        {
            "name": "fast",
            "baseName": "fast",
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
    return GetFeeRecommendationsUTXOsRI;
}());
exports.GetFeeRecommendationsUTXOsRI = GetFeeRecommendationsUTXOsRI;
//# sourceMappingURL=getFeeRecommendationsUTXOsRI.js.map