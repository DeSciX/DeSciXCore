"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetEIP1559FeeRecommendationsEVMRI = void 0;
var GetEIP1559FeeRecommendationsEVMRI = (function () {
    function GetEIP1559FeeRecommendationsEVMRI() {
    }
    GetEIP1559FeeRecommendationsEVMRI.getAttributeTypeMap = function () {
        return GetEIP1559FeeRecommendationsEVMRI.attributeTypeMap;
    };
    GetEIP1559FeeRecommendationsEVMRI.discriminator = undefined;
    GetEIP1559FeeRecommendationsEVMRI.attributeTypeMap = [
        {
            "name": "lastBlock",
            "baseName": "lastBlock",
            "type": "number"
        },
        {
            "name": "baseFeePerGas",
            "baseName": "baseFeePerGas",
            "type": "GetEIP1559FeeRecommendationsEVMRIBaseFeePerGas"
        },
        {
            "name": "maxFeePerGas",
            "baseName": "maxFeePerGas",
            "type": "GetEIP1559FeeRecommendationsEVMRIMaxFeePerGas"
        },
        {
            "name": "maxPriorityFeePerGas",
            "baseName": "maxPriorityFeePerGas",
            "type": "GetEIP1559FeeRecommendationsEVMRIMaxPriorityFeePerGas"
        }
    ];
    return GetEIP1559FeeRecommendationsEVMRI;
}());
exports.GetEIP1559FeeRecommendationsEVMRI = GetEIP1559FeeRecommendationsEVMRI;
//# sourceMappingURL=getEIP1559FeeRecommendationsEVMRI.js.map