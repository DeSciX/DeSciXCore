"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EstimateFA2TransferFeeTezos403Response = void 0;
var EstimateFA2TransferFeeTezos403Response = (function () {
    function EstimateFA2TransferFeeTezos403Response() {
    }
    EstimateFA2TransferFeeTezos403Response.getAttributeTypeMap = function () {
        return EstimateFA2TransferFeeTezos403Response.attributeTypeMap;
    };
    EstimateFA2TransferFeeTezos403Response.discriminator = undefined;
    EstimateFA2TransferFeeTezos403Response.attributeTypeMap = [
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
            "type": "EstimateFA2TransferFeeTezosE403"
        }
    ];
    return EstimateFA2TransferFeeTezos403Response;
}());
exports.EstimateFA2TransferFeeTezos403Response = EstimateFA2TransferFeeTezos403Response;
//# sourceMappingURL=estimateFA2TransferFeeTezos403Response.js.map