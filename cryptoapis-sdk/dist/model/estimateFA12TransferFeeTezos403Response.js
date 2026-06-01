"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EstimateFA12TransferFeeTezos403Response = void 0;
var EstimateFA12TransferFeeTezos403Response = (function () {
    function EstimateFA12TransferFeeTezos403Response() {
    }
    EstimateFA12TransferFeeTezos403Response.getAttributeTypeMap = function () {
        return EstimateFA12TransferFeeTezos403Response.attributeTypeMap;
    };
    EstimateFA12TransferFeeTezos403Response.discriminator = undefined;
    EstimateFA12TransferFeeTezos403Response.attributeTypeMap = [
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
            "type": "EstimateFA12TransferFeeTezosE403"
        }
    ];
    return EstimateFA12TransferFeeTezos403Response;
}());
exports.EstimateFA12TransferFeeTezos403Response = EstimateFA12TransferFeeTezos403Response;
//# sourceMappingURL=estimateFA12TransferFeeTezos403Response.js.map