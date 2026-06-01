"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EstimateTokenTransferGasLimitEVM400Response = void 0;
var EstimateTokenTransferGasLimitEVM400Response = (function () {
    function EstimateTokenTransferGasLimitEVM400Response() {
    }
    EstimateTokenTransferGasLimitEVM400Response.getAttributeTypeMap = function () {
        return EstimateTokenTransferGasLimitEVM400Response.attributeTypeMap;
    };
    EstimateTokenTransferGasLimitEVM400Response.discriminator = undefined;
    EstimateTokenTransferGasLimitEVM400Response.attributeTypeMap = [
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
            "type": "EstimateTokenTransferGasLimitEVME400"
        }
    ];
    return EstimateTokenTransferGasLimitEVM400Response;
}());
exports.EstimateTokenTransferGasLimitEVM400Response = EstimateTokenTransferGasLimitEVM400Response;
//# sourceMappingURL=estimateTokenTransferGasLimitEVM400Response.js.map