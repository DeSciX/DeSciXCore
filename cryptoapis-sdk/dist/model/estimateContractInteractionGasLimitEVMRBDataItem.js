"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EstimateContractInteractionGasLimitEVMRBDataItem = void 0;
var EstimateContractInteractionGasLimitEVMRBDataItem = (function () {
    function EstimateContractInteractionGasLimitEVMRBDataItem() {
    }
    EstimateContractInteractionGasLimitEVMRBDataItem.getAttributeTypeMap = function () {
        return EstimateContractInteractionGasLimitEVMRBDataItem.attributeTypeMap;
    };
    EstimateContractInteractionGasLimitEVMRBDataItem.discriminator = undefined;
    EstimateContractInteractionGasLimitEVMRBDataItem.attributeTypeMap = [
        {
            "name": "amount",
            "baseName": "amount",
            "type": "string"
        },
        {
            "name": "inputData",
            "baseName": "inputData",
            "type": "string"
        },
        {
            "name": "recipient",
            "baseName": "recipient",
            "type": "string"
        },
        {
            "name": "sender",
            "baseName": "sender",
            "type": "string"
        }
    ];
    return EstimateContractInteractionGasLimitEVMRBDataItem;
}());
exports.EstimateContractInteractionGasLimitEVMRBDataItem = EstimateContractInteractionGasLimitEVMRBDataItem;
//# sourceMappingURL=estimateContractInteractionGasLimitEVMRBDataItem.js.map