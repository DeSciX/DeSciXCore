"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetFeeRecommendationsTezos401Response = void 0;
var GetFeeRecommendationsTezos401Response = (function () {
    function GetFeeRecommendationsTezos401Response() {
    }
    GetFeeRecommendationsTezos401Response.getAttributeTypeMap = function () {
        return GetFeeRecommendationsTezos401Response.attributeTypeMap;
    };
    GetFeeRecommendationsTezos401Response.discriminator = undefined;
    GetFeeRecommendationsTezos401Response.attributeTypeMap = [
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
            "type": "GetFeeRecommendationsTezosE401"
        }
    ];
    return GetFeeRecommendationsTezos401Response;
}());
exports.GetFeeRecommendationsTezos401Response = GetFeeRecommendationsTezos401Response;
//# sourceMappingURL=getFeeRecommendationsTezos401Response.js.map