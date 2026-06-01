"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetFeeRecommendationsUTXOs401Response = void 0;
var GetFeeRecommendationsUTXOs401Response = (function () {
    function GetFeeRecommendationsUTXOs401Response() {
    }
    GetFeeRecommendationsUTXOs401Response.getAttributeTypeMap = function () {
        return GetFeeRecommendationsUTXOs401Response.attributeTypeMap;
    };
    GetFeeRecommendationsUTXOs401Response.discriminator = undefined;
    GetFeeRecommendationsUTXOs401Response.attributeTypeMap = [
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
            "type": "GetFeeRecommendationsUTXOsE401"
        }
    ];
    return GetFeeRecommendationsUTXOs401Response;
}());
exports.GetFeeRecommendationsUTXOs401Response = GetFeeRecommendationsUTXOs401Response;
//# sourceMappingURL=getFeeRecommendationsUTXOs401Response.js.map