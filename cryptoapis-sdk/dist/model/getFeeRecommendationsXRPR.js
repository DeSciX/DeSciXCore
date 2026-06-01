"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetFeeRecommendationsXRPR = void 0;
var GetFeeRecommendationsXRPR = (function () {
    function GetFeeRecommendationsXRPR() {
    }
    GetFeeRecommendationsXRPR.getAttributeTypeMap = function () {
        return GetFeeRecommendationsXRPR.attributeTypeMap;
    };
    GetFeeRecommendationsXRPR.discriminator = undefined;
    GetFeeRecommendationsXRPR.attributeTypeMap = [
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
            "type": "GetFeeRecommendationsXRPRData"
        }
    ];
    return GetFeeRecommendationsXRPR;
}());
exports.GetFeeRecommendationsXRPR = GetFeeRecommendationsXRPR;
//# sourceMappingURL=getFeeRecommendationsXRPR.js.map