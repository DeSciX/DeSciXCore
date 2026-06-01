"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetFeeRecommendationsEVM401Response = void 0;
var GetFeeRecommendationsEVM401Response = (function () {
    function GetFeeRecommendationsEVM401Response() {
    }
    GetFeeRecommendationsEVM401Response.getAttributeTypeMap = function () {
        return GetFeeRecommendationsEVM401Response.attributeTypeMap;
    };
    GetFeeRecommendationsEVM401Response.discriminator = undefined;
    GetFeeRecommendationsEVM401Response.attributeTypeMap = [
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
            "type": "GetFeeRecommendationsEVME401"
        }
    ];
    return GetFeeRecommendationsEVM401Response;
}());
exports.GetFeeRecommendationsEVM401Response = GetFeeRecommendationsEVM401Response;
//# sourceMappingURL=getFeeRecommendationsEVM401Response.js.map