"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetFeeRecommendationsKASPA401Response = void 0;
var GetFeeRecommendationsKASPA401Response = (function () {
    function GetFeeRecommendationsKASPA401Response() {
    }
    GetFeeRecommendationsKASPA401Response.getAttributeTypeMap = function () {
        return GetFeeRecommendationsKASPA401Response.attributeTypeMap;
    };
    GetFeeRecommendationsKASPA401Response.discriminator = undefined;
    GetFeeRecommendationsKASPA401Response.attributeTypeMap = [
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
            "type": "GetFeeRecommendationsKASPAE401"
        }
    ];
    return GetFeeRecommendationsKASPA401Response;
}());
exports.GetFeeRecommendationsKASPA401Response = GetFeeRecommendationsKASPA401Response;
//# sourceMappingURL=getFeeRecommendationsKASPA401Response.js.map