"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EstimateTokenTransferGasLimitEVM403Response = void 0;
var EstimateTokenTransferGasLimitEVM403Response = (function () {
    function EstimateTokenTransferGasLimitEVM403Response() {
    }
    EstimateTokenTransferGasLimitEVM403Response.getAttributeTypeMap = function () {
        return EstimateTokenTransferGasLimitEVM403Response.attributeTypeMap;
    };
    EstimateTokenTransferGasLimitEVM403Response.discriminator = undefined;
    EstimateTokenTransferGasLimitEVM403Response.attributeTypeMap = [
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
            "type": "EstimateTokenTransferGasLimitEVME403"
        }
    ];
    return EstimateTokenTransferGasLimitEVM403Response;
}());
exports.EstimateTokenTransferGasLimitEVM403Response = EstimateTokenTransferGasLimitEVM403Response;
//# sourceMappingURL=estimateTokenTransferGasLimitEVM403Response.js.map