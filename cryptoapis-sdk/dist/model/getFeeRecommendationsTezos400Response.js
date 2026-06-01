"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetFeeRecommendationsTezos400Response = void 0;
var GetFeeRecommendationsTezos400Response = (function () {
    function GetFeeRecommendationsTezos400Response() {
    }
    GetFeeRecommendationsTezos400Response.getAttributeTypeMap = function () {
        return GetFeeRecommendationsTezos400Response.attributeTypeMap;
    };
    GetFeeRecommendationsTezos400Response.discriminator = undefined;
    GetFeeRecommendationsTezos400Response.attributeTypeMap = [
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
            "type": "GetFeeRecommendationsTezosE400"
        }
    ];
    return GetFeeRecommendationsTezos400Response;
}());
exports.GetFeeRecommendationsTezos400Response = GetFeeRecommendationsTezos400Response;
//# sourceMappingURL=getFeeRecommendationsTezos400Response.js.map