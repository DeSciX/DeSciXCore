"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EstimateTransferFeeTezos400Response = void 0;
var EstimateTransferFeeTezos400Response = (function () {
    function EstimateTransferFeeTezos400Response() {
    }
    EstimateTransferFeeTezos400Response.getAttributeTypeMap = function () {
        return EstimateTransferFeeTezos400Response.attributeTypeMap;
    };
    EstimateTransferFeeTezos400Response.discriminator = undefined;
    EstimateTransferFeeTezos400Response.attributeTypeMap = [
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
            "type": "EstimateTransferFeeTezosE400"
        }
    ];
    return EstimateTransferFeeTezos400Response;
}());
exports.EstimateTransferFeeTezos400Response = EstimateTransferFeeTezos400Response;
//# sourceMappingURL=estimateTransferFeeTezos400Response.js.map