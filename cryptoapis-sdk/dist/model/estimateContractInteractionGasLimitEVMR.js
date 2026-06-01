"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EstimateContractInteractionGasLimitEVMR = void 0;
var EstimateContractInteractionGasLimitEVMR = (function () {
    function EstimateContractInteractionGasLimitEVMR() {
    }
    EstimateContractInteractionGasLimitEVMR.getAttributeTypeMap = function () {
        return EstimateContractInteractionGasLimitEVMR.attributeTypeMap;
    };
    EstimateContractInteractionGasLimitEVMR.discriminator = undefined;
    EstimateContractInteractionGasLimitEVMR.attributeTypeMap = [
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
            "type": "EstimateContractInteractionGasLimitEVMRData"
        }
    ];
    return EstimateContractInteractionGasLimitEVMR;
}());
exports.EstimateContractInteractionGasLimitEVMR = EstimateContractInteractionGasLimitEVMR;
//# sourceMappingURL=estimateContractInteractionGasLimitEVMR.js.map