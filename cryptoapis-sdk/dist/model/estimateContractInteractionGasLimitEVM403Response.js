"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EstimateContractInteractionGasLimitEVM403Response = void 0;
var EstimateContractInteractionGasLimitEVM403Response = (function () {
    function EstimateContractInteractionGasLimitEVM403Response() {
    }
    EstimateContractInteractionGasLimitEVM403Response.getAttributeTypeMap = function () {
        return EstimateContractInteractionGasLimitEVM403Response.attributeTypeMap;
    };
    EstimateContractInteractionGasLimitEVM403Response.discriminator = undefined;
    EstimateContractInteractionGasLimitEVM403Response.attributeTypeMap = [
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
            "type": "EstimateContractInteractionGasLimitEVME403"
        }
    ];
    return EstimateContractInteractionGasLimitEVM403Response;
}());
exports.EstimateContractInteractionGasLimitEVM403Response = EstimateContractInteractionGasLimitEVM403Response;
//# sourceMappingURL=estimateContractInteractionGasLimitEVM403Response.js.map