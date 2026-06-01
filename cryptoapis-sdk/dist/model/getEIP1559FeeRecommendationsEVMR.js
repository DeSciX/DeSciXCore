"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetEIP1559FeeRecommendationsEVMR = void 0;
var GetEIP1559FeeRecommendationsEVMR = (function () {
    function GetEIP1559FeeRecommendationsEVMR() {
    }
    GetEIP1559FeeRecommendationsEVMR.getAttributeTypeMap = function () {
        return GetEIP1559FeeRecommendationsEVMR.attributeTypeMap;
    };
    GetEIP1559FeeRecommendationsEVMR.discriminator = undefined;
    GetEIP1559FeeRecommendationsEVMR.attributeTypeMap = [
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
            "name": "data",
            "baseName": "data",
            "type": "GetEIP1559FeeRecommendationsEVMRData"
        }
    ];
    return GetEIP1559FeeRecommendationsEVMR;
}());
exports.GetEIP1559FeeRecommendationsEVMR = GetEIP1559FeeRecommendationsEVMR;
//# sourceMappingURL=getEIP1559FeeRecommendationsEVMR.js.map