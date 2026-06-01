"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EstimateContractInteractionGasLimitEVMRB = void 0;
var EstimateContractInteractionGasLimitEVMRB = (function () {
    function EstimateContractInteractionGasLimitEVMRB() {
    }
    EstimateContractInteractionGasLimitEVMRB.getAttributeTypeMap = function () {
        return EstimateContractInteractionGasLimitEVMRB.attributeTypeMap;
    };
    EstimateContractInteractionGasLimitEVMRB.discriminator = undefined;
    EstimateContractInteractionGasLimitEVMRB.attributeTypeMap = [
        {
            "name": "context",
            "baseName": "context",
            "type": "string"
        },
        {
            "name": "data",
            "baseName": "data",
            "type": "EstimateContractInteractionGasLimitEVMRBData"
        }
    ];
    return EstimateContractInteractionGasLimitEVMRB;
}());
exports.EstimateContractInteractionGasLimitEVMRB = EstimateContractInteractionGasLimitEVMRB;
//# sourceMappingURL=estimateContractInteractionGasLimitEVMRB.js.map