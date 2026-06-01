"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetFeeRecommendationsTezosR = void 0;
var GetFeeRecommendationsTezosR = (function () {
    function GetFeeRecommendationsTezosR() {
    }
    GetFeeRecommendationsTezosR.getAttributeTypeMap = function () {
        return GetFeeRecommendationsTezosR.attributeTypeMap;
    };
    GetFeeRecommendationsTezosR.discriminator = undefined;
    GetFeeRecommendationsTezosR.attributeTypeMap = [
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
            "type": "GetFeeRecommendationsTezosRData"
        }
    ];
    return GetFeeRecommendationsTezosR;
}());
exports.GetFeeRecommendationsTezosR = GetFeeRecommendationsTezosR;
//# sourceMappingURL=getFeeRecommendationsTezosR.js.map