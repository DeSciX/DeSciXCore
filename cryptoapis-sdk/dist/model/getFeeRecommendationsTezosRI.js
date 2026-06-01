"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetFeeRecommendationsTezosRI = void 0;
var GetFeeRecommendationsTezosRI = (function () {
    function GetFeeRecommendationsTezosRI() {
    }
    GetFeeRecommendationsTezosRI.getAttributeTypeMap = function () {
        return GetFeeRecommendationsTezosRI.attributeTypeMap;
    };
    GetFeeRecommendationsTezosRI.discriminator = undefined;
    GetFeeRecommendationsTezosRI.attributeTypeMap = [
        {
            "name": "minimalCostPerByte",
            "baseName": "minimalCostPerByte",
            "type": "string"
        },
        {
            "name": "minimalCostPerGasUnit",
            "baseName": "minimalCostPerGasUnit",
            "type": "string"
        },
        {
            "name": "minimalFee",
            "baseName": "minimalFee",
            "type": "string"
        },
        {
            "name": "storageCostPerByte",
            "baseName": "storageCostPerByte",
            "type": "string"
        },
        {
            "name": "unit",
            "baseName": "unit",
            "type": "string"
        }
    ];
    return GetFeeRecommendationsTezosRI;
}());
exports.GetFeeRecommendationsTezosRI = GetFeeRecommendationsTezosRI;
//# sourceMappingURL=getFeeRecommendationsTezosRI.js.map