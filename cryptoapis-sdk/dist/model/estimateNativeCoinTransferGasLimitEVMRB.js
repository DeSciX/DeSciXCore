"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EstimateNativeCoinTransferGasLimitEVMRB = void 0;
var EstimateNativeCoinTransferGasLimitEVMRB = (function () {
    function EstimateNativeCoinTransferGasLimitEVMRB() {
    }
    EstimateNativeCoinTransferGasLimitEVMRB.getAttributeTypeMap = function () {
        return EstimateNativeCoinTransferGasLimitEVMRB.attributeTypeMap;
    };
    EstimateNativeCoinTransferGasLimitEVMRB.discriminator = undefined;
    EstimateNativeCoinTransferGasLimitEVMRB.attributeTypeMap = [
        {
            "name": "context",
            "baseName": "context",
            "type": "string"
        },
        {
            "name": "data",
            "baseName": "data",
            "type": "EstimateNativeCoinTransferGasLimitEVMRBData"
        }
    ];
    return EstimateNativeCoinTransferGasLimitEVMRB;
}());
exports.EstimateNativeCoinTransferGasLimitEVMRB = EstimateNativeCoinTransferGasLimitEVMRB;
//# sourceMappingURL=estimateNativeCoinTransferGasLimitEVMRB.js.map