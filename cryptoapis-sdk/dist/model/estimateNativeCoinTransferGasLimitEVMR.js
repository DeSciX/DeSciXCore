"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EstimateNativeCoinTransferGasLimitEVMR = void 0;
var EstimateNativeCoinTransferGasLimitEVMR = (function () {
    function EstimateNativeCoinTransferGasLimitEVMR() {
    }
    EstimateNativeCoinTransferGasLimitEVMR.getAttributeTypeMap = function () {
        return EstimateNativeCoinTransferGasLimitEVMR.attributeTypeMap;
    };
    EstimateNativeCoinTransferGasLimitEVMR.discriminator = undefined;
    EstimateNativeCoinTransferGasLimitEVMR.attributeTypeMap = [
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
            "type": "EstimateNativeCoinTransferGasLimitEVMRData"
        }
    ];
    return EstimateNativeCoinTransferGasLimitEVMR;
}());
exports.EstimateNativeCoinTransferGasLimitEVMR = EstimateNativeCoinTransferGasLimitEVMR;
//# sourceMappingURL=estimateNativeCoinTransferGasLimitEVMR.js.map