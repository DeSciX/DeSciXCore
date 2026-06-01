"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetEIP1559FeeRecommendationsEVMRIMaxFeePerGas = void 0;
var GetEIP1559FeeRecommendationsEVMRIMaxFeePerGas = (function () {
    function GetEIP1559FeeRecommendationsEVMRIMaxFeePerGas() {
    }
    GetEIP1559FeeRecommendationsEVMRIMaxFeePerGas.getAttributeTypeMap = function () {
        return GetEIP1559FeeRecommendationsEVMRIMaxFeePerGas.attributeTypeMap;
    };
    GetEIP1559FeeRecommendationsEVMRIMaxFeePerGas.discriminator = undefined;
    GetEIP1559FeeRecommendationsEVMRIMaxFeePerGas.attributeTypeMap = [
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
    return GetEIP1559FeeRecommendationsEVMRIMaxFeePerGas;
}());
exports.GetEIP1559FeeRecommendationsEVMRIMaxFeePerGas = GetEIP1559FeeRecommendationsEVMRIMaxFeePerGas;
//# sourceMappingURL=getEIP1559FeeRecommendationsEVMRIMaxFeePerGas.js.map