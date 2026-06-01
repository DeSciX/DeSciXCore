"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetFeeRecommendationsTRON403Response = void 0;
var GetFeeRecommendationsTRON403Response = (function () {
    function GetFeeRecommendationsTRON403Response() {
    }
    GetFeeRecommendationsTRON403Response.getAttributeTypeMap = function () {
        return GetFeeRecommendationsTRON403Response.attributeTypeMap;
    };
    GetFeeRecommendationsTRON403Response.discriminator = undefined;
    GetFeeRecommendationsTRON403Response.attributeTypeMap = [
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
            "type": "GetFeeRecommendationsTRONE403"
        }
    ];
    return GetFeeRecommendationsTRON403Response;
}());
exports.GetFeeRecommendationsTRON403Response = GetFeeRecommendationsTRON403Response;
//# sourceMappingURL=getFeeRecommendationsTRON403Response.js.map