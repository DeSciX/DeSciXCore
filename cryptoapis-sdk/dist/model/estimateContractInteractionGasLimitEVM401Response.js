"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EstimateContractInteractionGasLimitEVM401Response = void 0;
var EstimateContractInteractionGasLimitEVM401Response = (function () {
    function EstimateContractInteractionGasLimitEVM401Response() {
    }
    EstimateContractInteractionGasLimitEVM401Response.getAttributeTypeMap = function () {
        return EstimateContractInteractionGasLimitEVM401Response.attributeTypeMap;
    };
    EstimateContractInteractionGasLimitEVM401Response.discriminator = undefined;
    EstimateContractInteractionGasLimitEVM401Response.attributeTypeMap = [
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
            "type": "EstimateContractInteractionGasLimitEVME401"
        }
    ];
    return EstimateContractInteractionGasLimitEVM401Response;
}());
exports.EstimateContractInteractionGasLimitEVM401Response = EstimateContractInteractionGasLimitEVM401Response;
//# sourceMappingURL=estimateContractInteractionGasLimitEVM401Response.js.map