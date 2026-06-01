"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EstimateNativeCoinTransferGasLimitEVM403Response = void 0;
var EstimateNativeCoinTransferGasLimitEVM403Response = (function () {
    function EstimateNativeCoinTransferGasLimitEVM403Response() {
    }
    EstimateNativeCoinTransferGasLimitEVM403Response.getAttributeTypeMap = function () {
        return EstimateNativeCoinTransferGasLimitEVM403Response.attributeTypeMap;
    };
    EstimateNativeCoinTransferGasLimitEVM403Response.discriminator = undefined;
    EstimateNativeCoinTransferGasLimitEVM403Response.attributeTypeMap = [
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
            "type": "EstimateNativeCoinTransferGasLimitEVME403"
        }
    ];
    return EstimateNativeCoinTransferGasLimitEVM403Response;
}());
exports.EstimateNativeCoinTransferGasLimitEVM403Response = EstimateNativeCoinTransferGasLimitEVM403Response;
//# sourceMappingURL=estimateNativeCoinTransferGasLimitEVM403Response.js.map