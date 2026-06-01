"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EstimateNativeCoinTransferGasLimitEVM400Response = void 0;
var EstimateNativeCoinTransferGasLimitEVM400Response = (function () {
    function EstimateNativeCoinTransferGasLimitEVM400Response() {
    }
    EstimateNativeCoinTransferGasLimitEVM400Response.getAttributeTypeMap = function () {
        return EstimateNativeCoinTransferGasLimitEVM400Response.attributeTypeMap;
    };
    EstimateNativeCoinTransferGasLimitEVM400Response.discriminator = undefined;
    EstimateNativeCoinTransferGasLimitEVM400Response.attributeTypeMap = [
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
            "name": "error",
            "baseName": "error",
            "type": "EstimateNativeCoinTransferGasLimitEVME400"
        }
    ];
    return EstimateNativeCoinTransferGasLimitEVM400Response;
}());
exports.EstimateNativeCoinTransferGasLimitEVM400Response = EstimateNativeCoinTransferGasLimitEVM400Response;
//# sourceMappingURL=estimateNativeCoinTransferGasLimitEVM400Response.js.map