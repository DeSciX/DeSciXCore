"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EstimateTokenTransferGasLimitEVMRB = void 0;
var EstimateTokenTransferGasLimitEVMRB = (function () {
    function EstimateTokenTransferGasLimitEVMRB() {
    }
    EstimateTokenTransferGasLimitEVMRB.getAttributeTypeMap = function () {
        return EstimateTokenTransferGasLimitEVMRB.attributeTypeMap;
    };
    EstimateTokenTransferGasLimitEVMRB.discriminator = undefined;
    EstimateTokenTransferGasLimitEVMRB.attributeTypeMap = [
        {
            "name": "context",
            "baseName": "context",
            "type": "string"
        },
        {
            "name": "data",
            "baseName": "data",
            "type": "EstimateTokenTransferGasLimitEVMRBData"
        }
    ];
    return EstimateTokenTransferGasLimitEVMRB;
}());
exports.EstimateTokenTransferGasLimitEVMRB = EstimateTokenTransferGasLimitEVMRB;
//# sourceMappingURL=estimateTokenTransferGasLimitEVMRB.js.map