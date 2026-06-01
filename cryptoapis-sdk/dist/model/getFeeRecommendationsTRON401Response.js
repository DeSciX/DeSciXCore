"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetFeeRecommendationsTRON401Response = void 0;
var GetFeeRecommendationsTRON401Response = (function () {
    function GetFeeRecommendationsTRON401Response() {
    }
    GetFeeRecommendationsTRON401Response.getAttributeTypeMap = function () {
        return GetFeeRecommendationsTRON401Response.attributeTypeMap;
    };
    GetFeeRecommendationsTRON401Response.discriminator = undefined;
    GetFeeRecommendationsTRON401Response.attributeTypeMap = [
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
            "name": "error",
            "baseName": "error",
            "type": "GetFeeRecommendationsTRONE401"
        }
    ];
    return GetFeeRecommendationsTRON401Response;
}());
exports.GetFeeRecommendationsTRON401Response = GetFeeRecommendationsTRON401Response;
//# sourceMappingURL=getFeeRecommendationsTRON401Response.js.map