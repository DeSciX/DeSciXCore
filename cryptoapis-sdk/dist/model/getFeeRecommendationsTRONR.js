"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetFeeRecommendationsTRONR = void 0;
var GetFeeRecommendationsTRONR = (function () {
    function GetFeeRecommendationsTRONR() {
    }
    GetFeeRecommendationsTRONR.getAttributeTypeMap = function () {
        return GetFeeRecommendationsTRONR.attributeTypeMap;
    };
    GetFeeRecommendationsTRONR.discriminator = undefined;
    GetFeeRecommendationsTRONR.attributeTypeMap = [
        {
            "name": "apiVersion",
            "baseName": "apiVersion",
            "type": "string"
        },
        {
            "name": "requestId",
            "baseName": "requestId",
            "type": "string"
        },
        {
            "name": "context",
            "baseName": "context",
            "type": "string"
        },
        {
            "name": "data",
            "baseName": "data",
            "type": "GetFeeRecommendationsTRONRData"
        }
    ];
    return GetFeeRecommendationsTRONR;
}());
exports.GetFeeRecommendationsTRONR = GetFeeRecommendationsTRONR;
//# sourceMappingURL=getFeeRecommendationsTRONR.js.map