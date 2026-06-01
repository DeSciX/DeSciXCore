"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetEIP1559FeeRecommendationsEVM403Response = void 0;
var GetEIP1559FeeRecommendationsEVM403Response = (function () {
    function GetEIP1559FeeRecommendationsEVM403Response() {
    }
    GetEIP1559FeeRecommendationsEVM403Response.getAttributeTypeMap = function () {
        return GetEIP1559FeeRecommendationsEVM403Response.attributeTypeMap;
    };
    GetEIP1559FeeRecommendationsEVM403Response.discriminator = undefined;
    GetEIP1559FeeRecommendationsEVM403Response.attributeTypeMap = [
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
            "type": "GetEIP1559FeeRecommendationsEVME403"
        }
    ];
    return GetEIP1559FeeRecommendationsEVM403Response;
}());
exports.GetEIP1559FeeRecommendationsEVM403Response = GetEIP1559FeeRecommendationsEVM403Response;
//# sourceMappingURL=getEIP1559FeeRecommendationsEVM403Response.js.map