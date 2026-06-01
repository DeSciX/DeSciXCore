"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EstimateTokenTransferGasLimitEVMR = void 0;
var EstimateTokenTransferGasLimitEVMR = (function () {
    function EstimateTokenTransferGasLimitEVMR() {
    }
    EstimateTokenTransferGasLimitEVMR.getAttributeTypeMap = function () {
        return EstimateTokenTransferGasLimitEVMR.attributeTypeMap;
    };
    EstimateTokenTransferGasLimitEVMR.discriminator = undefined;
    EstimateTokenTransferGasLimitEVMR.attributeTypeMap = [
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
            "type": "EstimateTokenTransferGasLimitEVMRData"
        }
    ];
    return EstimateTokenTransferGasLimitEVMR;
}());
exports.EstimateTokenTransferGasLimitEVMR = EstimateTokenTransferGasLimitEVMR;
//# sourceMappingURL=estimateTokenTransferGasLimitEVMR.js.map