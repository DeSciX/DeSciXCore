"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetFeeRecommendationsTRON400Response = void 0;
var GetFeeRecommendationsTRON400Response = (function () {
    function GetFeeRecommendationsTRON400Response() {
    }
    GetFeeRecommendationsTRON400Response.getAttributeTypeMap = function () {
        return GetFeeRecommendationsTRON400Response.attributeTypeMap;
    };
    GetFeeRecommendationsTRON400Response.discriminator = undefined;
    GetFeeRecommendationsTRON400Response.attributeTypeMap = [
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
            "type": "GetFeeRecommendationsTRONE400"
        }
    ];
    return GetFeeRecommendationsTRON400Response;
}());
exports.GetFeeRecommendationsTRON400Response = GetFeeRecommendationsTRON400Response;
//# sourceMappingURL=getFeeRecommendationsTRON400Response.js.map