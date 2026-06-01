"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetFeeRecommendationsKASPA403Response = void 0;
var GetFeeRecommendationsKASPA403Response = (function () {
    function GetFeeRecommendationsKASPA403Response() {
    }
    GetFeeRecommendationsKASPA403Response.getAttributeTypeMap = function () {
        return GetFeeRecommendationsKASPA403Response.attributeTypeMap;
    };
    GetFeeRecommendationsKASPA403Response.discriminator = undefined;
    GetFeeRecommendationsKASPA403Response.attributeTypeMap = [
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
            "type": "GetFeeRecommendationsKASPAE403"
        }
    ];
    return GetFeeRecommendationsKASPA403Response;
}());
exports.GetFeeRecommendationsKASPA403Response = GetFeeRecommendationsKASPA403Response;
//# sourceMappingURL=getFeeRecommendationsKASPA403Response.js.map