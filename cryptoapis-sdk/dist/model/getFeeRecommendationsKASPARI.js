"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetFeeRecommendationsKASPARI = void 0;
var GetFeeRecommendationsKASPARI = (function () {
    function GetFeeRecommendationsKASPARI() {
    }
    GetFeeRecommendationsKASPARI.getAttributeTypeMap = function () {
        return GetFeeRecommendationsKASPARI.attributeTypeMap;
    };
    GetFeeRecommendationsKASPARI.discriminator = undefined;
    GetFeeRecommendationsKASPARI.attributeTypeMap = [
        {
            "name": "feePerGram",
            "baseName": "feePerGram",
            "type": "GetFeeRecommendationsKASPARIFeePerGram"
        },
        {
            "name": "timeForMining",
            "baseName": "timeForMining",
            "type": "GetFeeRecommendationsKASPARITimeForMining"
        }
    ];
    return GetFeeRecommendationsKASPARI;
}());
exports.GetFeeRecommendationsKASPARI = GetFeeRecommendationsKASPARI;
//# sourceMappingURL=getFeeRecommendationsKASPARI.js.map