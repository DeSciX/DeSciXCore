"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetFeeRecommendationsXRP403Response = void 0;
var GetFeeRecommendationsXRP403Response = (function () {
    function GetFeeRecommendationsXRP403Response() {
    }
    GetFeeRecommendationsXRP403Response.getAttributeTypeMap = function () {
        return GetFeeRecommendationsXRP403Response.attributeTypeMap;
    };
    GetFeeRecommendationsXRP403Response.discriminator = undefined;
    GetFeeRecommendationsXRP403Response.attributeTypeMap = [
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
            "type": "GetFeeRecommendationsXRPE403"
        }
    ];
    return GetFeeRecommendationsXRP403Response;
}());
exports.GetFeeRecommendationsXRP403Response = GetFeeRecommendationsXRP403Response;
//# sourceMappingURL=getFeeRecommendationsXRP403Response.js.map