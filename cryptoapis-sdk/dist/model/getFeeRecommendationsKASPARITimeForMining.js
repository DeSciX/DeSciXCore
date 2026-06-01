"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetFeeRecommendationsKASPARITimeForMining = void 0;
var GetFeeRecommendationsKASPARITimeForMining = (function () {
    function GetFeeRecommendationsKASPARITimeForMining() {
    }
    GetFeeRecommendationsKASPARITimeForMining.getAttributeTypeMap = function () {
        return GetFeeRecommendationsKASPARITimeForMining.attributeTypeMap;
    };
    GetFeeRecommendationsKASPARITimeForMining.discriminator = undefined;
    GetFeeRecommendationsKASPARITimeForMining.attributeTypeMap = [
        {
            "name": "fast",
            "baseName": "fast",
            "type": "number"
        },
        {
            "name": "slow",
            "baseName": "slow",
            "type": "number"
        },
        {
            "name": "standard",
            "baseName": "standard",
            "type": "number"
        },
        {
            "name": "unit",
            "baseName": "unit",
            "type": "string"
        }
    ];
    return GetFeeRecommendationsKASPARITimeForMining;
}());
exports.GetFeeRecommendationsKASPARITimeForMining = GetFeeRecommendationsKASPARITimeForMining;
//# sourceMappingURL=getFeeRecommendationsKASPARITimeForMining.js.map