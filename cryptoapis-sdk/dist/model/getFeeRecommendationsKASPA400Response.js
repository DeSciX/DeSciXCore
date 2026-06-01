"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetFeeRecommendationsKASPA400Response = void 0;
var GetFeeRecommendationsKASPA400Response = (function () {
    function GetFeeRecommendationsKASPA400Response() {
    }
    GetFeeRecommendationsKASPA400Response.getAttributeTypeMap = function () {
        return GetFeeRecommendationsKASPA400Response.attributeTypeMap;
    };
    GetFeeRecommendationsKASPA400Response.discriminator = undefined;
    GetFeeRecommendationsKASPA400Response.attributeTypeMap = [
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
            "type": "GetFeeRecommendationsKASPAE400"
        }
    ];
    return GetFeeRecommendationsKASPA400Response;
}());
exports.GetFeeRecommendationsKASPA400Response = GetFeeRecommendationsKASPA400Response;
//# sourceMappingURL=getFeeRecommendationsKASPA400Response.js.map