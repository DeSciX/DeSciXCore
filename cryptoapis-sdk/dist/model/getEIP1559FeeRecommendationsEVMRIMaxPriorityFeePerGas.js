"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetEIP1559FeeRecommendationsEVMRIMaxPriorityFeePerGas = void 0;
var GetEIP1559FeeRecommendationsEVMRIMaxPriorityFeePerGas = (function () {
    function GetEIP1559FeeRecommendationsEVMRIMaxPriorityFeePerGas() {
    }
    GetEIP1559FeeRecommendationsEVMRIMaxPriorityFeePerGas.getAttributeTypeMap = function () {
        return GetEIP1559FeeRecommendationsEVMRIMaxPriorityFeePerGas.attributeTypeMap;
    };
    GetEIP1559FeeRecommendationsEVMRIMaxPriorityFeePerGas.discriminator = undefined;
    GetEIP1559FeeRecommendationsEVMRIMaxPriorityFeePerGas.attributeTypeMap = [
        {
            "name": "fast",
            "baseName": "fast",
            "type": "string"
        },
        {
            "name": "slow",
            "baseName": "slow",
            "type": "string"
        },
        {
            "name": "standard",
            "baseName": "standard",
            "type": "string"
        },
        {
            "name": "unit",
            "baseName": "unit",
            "type": "string"
        }
    ];
    return GetEIP1559FeeRecommendationsEVMRIMaxPriorityFeePerGas;
}());
exports.GetEIP1559FeeRecommendationsEVMRIMaxPriorityFeePerGas = GetEIP1559FeeRecommendationsEVMRIMaxPriorityFeePerGas;
//# sourceMappingURL=getEIP1559FeeRecommendationsEVMRIMaxPriorityFeePerGas.js.map