"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetEIP1559FeeRecommendationsEVM400Response = void 0;
var GetEIP1559FeeRecommendationsEVM400Response = (function () {
    function GetEIP1559FeeRecommendationsEVM400Response() {
    }
    GetEIP1559FeeRecommendationsEVM400Response.getAttributeTypeMap = function () {
        return GetEIP1559FeeRecommendationsEVM400Response.attributeTypeMap;
    };
    GetEIP1559FeeRecommendationsEVM400Response.discriminator = undefined;
    GetEIP1559FeeRecommendationsEVM400Response.attributeTypeMap = [
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
            "type": "GetEIP1559FeeRecommendationsEVME400"
        }
    ];
    return GetEIP1559FeeRecommendationsEVM400Response;
}());
exports.GetEIP1559FeeRecommendationsEVM400Response = GetEIP1559FeeRecommendationsEVM400Response;
//# sourceMappingURL=getEIP1559FeeRecommendationsEVM400Response.js.map