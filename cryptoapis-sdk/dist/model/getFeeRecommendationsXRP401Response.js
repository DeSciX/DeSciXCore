"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetFeeRecommendationsXRP401Response = void 0;
var GetFeeRecommendationsXRP401Response = (function () {
    function GetFeeRecommendationsXRP401Response() {
    }
    GetFeeRecommendationsXRP401Response.getAttributeTypeMap = function () {
        return GetFeeRecommendationsXRP401Response.attributeTypeMap;
    };
    GetFeeRecommendationsXRP401Response.discriminator = undefined;
    GetFeeRecommendationsXRP401Response.attributeTypeMap = [
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
            "type": "GetFeeRecommendationsXRPE401"
        }
    ];
    return GetFeeRecommendationsXRP401Response;
}());
exports.GetFeeRecommendationsXRP401Response = GetFeeRecommendationsXRP401Response;
//# sourceMappingURL=getFeeRecommendationsXRP401Response.js.map