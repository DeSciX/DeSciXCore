"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetFeeRecommendationsXRP400Response = void 0;
var GetFeeRecommendationsXRP400Response = (function () {
    function GetFeeRecommendationsXRP400Response() {
    }
    GetFeeRecommendationsXRP400Response.getAttributeTypeMap = function () {
        return GetFeeRecommendationsXRP400Response.attributeTypeMap;
    };
    GetFeeRecommendationsXRP400Response.discriminator = undefined;
    GetFeeRecommendationsXRP400Response.attributeTypeMap = [
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
            "type": "GetFeeRecommendationsXRPE400"
        }
    ];
    return GetFeeRecommendationsXRP400Response;
}());
exports.GetFeeRecommendationsXRP400Response = GetFeeRecommendationsXRP400Response;
//# sourceMappingURL=getFeeRecommendationsXRP400Response.js.map