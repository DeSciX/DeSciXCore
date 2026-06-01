"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EstimateTokenTransferGasLimitEVM401Response = void 0;
var EstimateTokenTransferGasLimitEVM401Response = (function () {
    function EstimateTokenTransferGasLimitEVM401Response() {
    }
    EstimateTokenTransferGasLimitEVM401Response.getAttributeTypeMap = function () {
        return EstimateTokenTransferGasLimitEVM401Response.attributeTypeMap;
    };
    EstimateTokenTransferGasLimitEVM401Response.discriminator = undefined;
    EstimateTokenTransferGasLimitEVM401Response.attributeTypeMap = [
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
            "type": "EstimateTokenTransferGasLimitEVME401"
        }
    ];
    return EstimateTokenTransferGasLimitEVM401Response;
}());
exports.EstimateTokenTransferGasLimitEVM401Response = EstimateTokenTransferGasLimitEVM401Response;
//# sourceMappingURL=estimateTokenTransferGasLimitEVM401Response.js.map