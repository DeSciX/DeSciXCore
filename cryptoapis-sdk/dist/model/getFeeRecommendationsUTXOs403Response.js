"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetFeeRecommendationsUTXOs403Response = void 0;
var GetFeeRecommendationsUTXOs403Response = (function () {
    function GetFeeRecommendationsUTXOs403Response() {
    }
    GetFeeRecommendationsUTXOs403Response.getAttributeTypeMap = function () {
        return GetFeeRecommendationsUTXOs403Response.attributeTypeMap;
    };
    GetFeeRecommendationsUTXOs403Response.discriminator = undefined;
    GetFeeRecommendationsUTXOs403Response.attributeTypeMap = [
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
            "type": "GetFeeRecommendationsUTXOsE403"
        }
    ];
    return GetFeeRecommendationsUTXOs403Response;
}());
exports.GetFeeRecommendationsUTXOs403Response = GetFeeRecommendationsUTXOs403Response;
//# sourceMappingURL=getFeeRecommendationsUTXOs403Response.js.map