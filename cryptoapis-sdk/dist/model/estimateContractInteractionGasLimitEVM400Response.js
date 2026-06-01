"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EstimateContractInteractionGasLimitEVM400Response = void 0;
var EstimateContractInteractionGasLimitEVM400Response = (function () {
    function EstimateContractInteractionGasLimitEVM400Response() {
    }
    EstimateContractInteractionGasLimitEVM400Response.getAttributeTypeMap = function () {
        return EstimateContractInteractionGasLimitEVM400Response.attributeTypeMap;
    };
    EstimateContractInteractionGasLimitEVM400Response.discriminator = undefined;
    EstimateContractInteractionGasLimitEVM400Response.attributeTypeMap = [
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
            "type": "EstimateContractInteractionGasLimitEVME400"
        }
    ];
    return EstimateContractInteractionGasLimitEVM400Response;
}());
exports.EstimateContractInteractionGasLimitEVM400Response = EstimateContractInteractionGasLimitEVM400Response;
//# sourceMappingURL=estimateContractInteractionGasLimitEVM400Response.js.map