"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EstimateFA2TransferFeeTezos401Response = void 0;
var EstimateFA2TransferFeeTezos401Response = (function () {
    function EstimateFA2TransferFeeTezos401Response() {
    }
    EstimateFA2TransferFeeTezos401Response.getAttributeTypeMap = function () {
        return EstimateFA2TransferFeeTezos401Response.attributeTypeMap;
    };
    EstimateFA2TransferFeeTezos401Response.discriminator = undefined;
    EstimateFA2TransferFeeTezos401Response.attributeTypeMap = [
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
            "type": "EstimateFA2TransferFeeTezosE401"
        }
    ];
    return EstimateFA2TransferFeeTezos401Response;
}());
exports.EstimateFA2TransferFeeTezos401Response = EstimateFA2TransferFeeTezos401Response;
//# sourceMappingURL=estimateFA2TransferFeeTezos401Response.js.map