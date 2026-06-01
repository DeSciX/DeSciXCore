"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EstimateFA2TransferFeeTezos400Response = void 0;
var EstimateFA2TransferFeeTezos400Response = (function () {
    function EstimateFA2TransferFeeTezos400Response() {
    }
    EstimateFA2TransferFeeTezos400Response.getAttributeTypeMap = function () {
        return EstimateFA2TransferFeeTezos400Response.attributeTypeMap;
    };
    EstimateFA2TransferFeeTezos400Response.discriminator = undefined;
    EstimateFA2TransferFeeTezos400Response.attributeTypeMap = [
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
            "type": "EstimateFA2TransferFeeTezosE400"
        }
    ];
    return EstimateFA2TransferFeeTezos400Response;
}());
exports.EstimateFA2TransferFeeTezos400Response = EstimateFA2TransferFeeTezos400Response;
//# sourceMappingURL=estimateFA2TransferFeeTezos400Response.js.map