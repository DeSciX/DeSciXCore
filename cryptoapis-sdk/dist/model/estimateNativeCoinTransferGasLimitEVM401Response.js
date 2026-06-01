"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EstimateNativeCoinTransferGasLimitEVM401Response = void 0;
var EstimateNativeCoinTransferGasLimitEVM401Response = (function () {
    function EstimateNativeCoinTransferGasLimitEVM401Response() {
    }
    EstimateNativeCoinTransferGasLimitEVM401Response.getAttributeTypeMap = function () {
        return EstimateNativeCoinTransferGasLimitEVM401Response.attributeTypeMap;
    };
    EstimateNativeCoinTransferGasLimitEVM401Response.discriminator = undefined;
    EstimateNativeCoinTransferGasLimitEVM401Response.attributeTypeMap = [
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
            "type": "EstimateNativeCoinTransferGasLimitEVME401"
        }
    ];
    return EstimateNativeCoinTransferGasLimitEVM401Response;
}());
exports.EstimateNativeCoinTransferGasLimitEVM401Response = EstimateNativeCoinTransferGasLimitEVM401Response;
//# sourceMappingURL=estimateNativeCoinTransferGasLimitEVM401Response.js.map