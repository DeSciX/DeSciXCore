"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetFeeRecommendationsEVM400Response = void 0;
var GetFeeRecommendationsEVM400Response = (function () {
    function GetFeeRecommendationsEVM400Response() {
    }
    GetFeeRecommendationsEVM400Response.getAttributeTypeMap = function () {
        return GetFeeRecommendationsEVM400Response.attributeTypeMap;
    };
    GetFeeRecommendationsEVM400Response.discriminator = undefined;
    GetFeeRecommendationsEVM400Response.attributeTypeMap = [
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
            "type": "GetFeeRecommendationsEVME400"
        }
    ];
    return GetFeeRecommendationsEVM400Response;
}());
exports.GetFeeRecommendationsEVM400Response = GetFeeRecommendationsEVM400Response;
//# sourceMappingURL=getFeeRecommendationsEVM400Response.js.map