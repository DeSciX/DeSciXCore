"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetFeeRecommendationsUTXOs400Response = void 0;
var GetFeeRecommendationsUTXOs400Response = (function () {
    function GetFeeRecommendationsUTXOs400Response() {
    }
    GetFeeRecommendationsUTXOs400Response.getAttributeTypeMap = function () {
        return GetFeeRecommendationsUTXOs400Response.attributeTypeMap;
    };
    GetFeeRecommendationsUTXOs400Response.discriminator = undefined;
    GetFeeRecommendationsUTXOs400Response.attributeTypeMap = [
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
            "type": "GetFeeRecommendationsUTXOsE400"
        }
    ];
    return GetFeeRecommendationsUTXOs400Response;
}());
exports.GetFeeRecommendationsUTXOs400Response = GetFeeRecommendationsUTXOs400Response;
//# sourceMappingURL=getFeeRecommendationsUTXOs400Response.js.map