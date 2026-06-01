"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetFeeRecommendationsEVM403Response = void 0;
var GetFeeRecommendationsEVM403Response = (function () {
    function GetFeeRecommendationsEVM403Response() {
    }
    GetFeeRecommendationsEVM403Response.getAttributeTypeMap = function () {
        return GetFeeRecommendationsEVM403Response.attributeTypeMap;
    };
    GetFeeRecommendationsEVM403Response.discriminator = undefined;
    GetFeeRecommendationsEVM403Response.attributeTypeMap = [
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
            "type": "GetFeeRecommendationsEVME403"
        }
    ];
    return GetFeeRecommendationsEVM403Response;
}());
exports.GetFeeRecommendationsEVM403Response = GetFeeRecommendationsEVM403Response;
//# sourceMappingURL=getFeeRecommendationsEVM403Response.js.map