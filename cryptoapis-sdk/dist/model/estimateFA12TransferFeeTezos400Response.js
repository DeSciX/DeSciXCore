"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EstimateFA12TransferFeeTezos400Response = void 0;
var EstimateFA12TransferFeeTezos400Response = (function () {
    function EstimateFA12TransferFeeTezos400Response() {
    }
    EstimateFA12TransferFeeTezos400Response.getAttributeTypeMap = function () {
        return EstimateFA12TransferFeeTezos400Response.attributeTypeMap;
    };
    EstimateFA12TransferFeeTezos400Response.discriminator = undefined;
    EstimateFA12TransferFeeTezos400Response.attributeTypeMap = [
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
            "type": "EstimateFA12TransferFeeTezosE400"
        }
    ];
    return EstimateFA12TransferFeeTezos400Response;
}());
exports.EstimateFA12TransferFeeTezos400Response = EstimateFA12TransferFeeTezos400Response;
//# sourceMappingURL=estimateFA12TransferFeeTezos400Response.js.map