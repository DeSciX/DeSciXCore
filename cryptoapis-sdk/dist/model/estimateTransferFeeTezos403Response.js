"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EstimateTransferFeeTezos403Response = void 0;
var EstimateTransferFeeTezos403Response = (function () {
    function EstimateTransferFeeTezos403Response() {
    }
    EstimateTransferFeeTezos403Response.getAttributeTypeMap = function () {
        return EstimateTransferFeeTezos403Response.attributeTypeMap;
    };
    EstimateTransferFeeTezos403Response.discriminator = undefined;
    EstimateTransferFeeTezos403Response.attributeTypeMap = [
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
            "type": "EstimateTransferFeeTezosE403"
        }
    ];
    return EstimateTransferFeeTezos403Response;
}());
exports.EstimateTransferFeeTezos403Response = EstimateTransferFeeTezos403Response;
//# sourceMappingURL=estimateTransferFeeTezos403Response.js.map