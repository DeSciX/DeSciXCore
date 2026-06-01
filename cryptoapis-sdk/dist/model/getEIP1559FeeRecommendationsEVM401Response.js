"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetEIP1559FeeRecommendationsEVM401Response = void 0;
var GetEIP1559FeeRecommendationsEVM401Response = (function () {
    function GetEIP1559FeeRecommendationsEVM401Response() {
    }
    GetEIP1559FeeRecommendationsEVM401Response.getAttributeTypeMap = function () {
        return GetEIP1559FeeRecommendationsEVM401Response.attributeTypeMap;
    };
    GetEIP1559FeeRecommendationsEVM401Response.discriminator = undefined;
    GetEIP1559FeeRecommendationsEVM401Response.attributeTypeMap = [
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
            "type": "GetEIP1559FeeRecommendationsEVME401"
        }
    ];
    return GetEIP1559FeeRecommendationsEVM401Response;
}());
exports.GetEIP1559FeeRecommendationsEVM401Response = GetEIP1559FeeRecommendationsEVM401Response;
//# sourceMappingURL=getEIP1559FeeRecommendationsEVM401Response.js.map