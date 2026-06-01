"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EstimateTransferFeeTezos401Response = void 0;
var EstimateTransferFeeTezos401Response = (function () {
    function EstimateTransferFeeTezos401Response() {
    }
    EstimateTransferFeeTezos401Response.getAttributeTypeMap = function () {
        return EstimateTransferFeeTezos401Response.attributeTypeMap;
    };
    EstimateTransferFeeTezos401Response.discriminator = undefined;
    EstimateTransferFeeTezos401Response.attributeTypeMap = [
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
            "type": "EstimateTransferFeeTezosE401"
        }
    ];
    return EstimateTransferFeeTezos401Response;
}());
exports.EstimateTransferFeeTezos401Response = EstimateTransferFeeTezos401Response;
//# sourceMappingURL=estimateTransferFeeTezos401Response.js.map