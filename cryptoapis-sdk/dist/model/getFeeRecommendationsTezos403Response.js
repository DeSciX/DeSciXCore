"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetFeeRecommendationsTezos403Response = void 0;
var GetFeeRecommendationsTezos403Response = (function () {
    function GetFeeRecommendationsTezos403Response() {
    }
    GetFeeRecommendationsTezos403Response.getAttributeTypeMap = function () {
        return GetFeeRecommendationsTezos403Response.attributeTypeMap;
    };
    GetFeeRecommendationsTezos403Response.discriminator = undefined;
    GetFeeRecommendationsTezos403Response.attributeTypeMap = [
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
            "type": "GetFeeRecommendationsTezosE403"
        }
    ];
    return GetFeeRecommendationsTezos403Response;
}());
exports.GetFeeRecommendationsTezos403Response = GetFeeRecommendationsTezos403Response;
//# sourceMappingURL=getFeeRecommendationsTezos403Response.js.map