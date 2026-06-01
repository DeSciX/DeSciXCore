"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EstimateFA12TransferFeeTezos401Response = void 0;
var EstimateFA12TransferFeeTezos401Response = (function () {
    function EstimateFA12TransferFeeTezos401Response() {
    }
    EstimateFA12TransferFeeTezos401Response.getAttributeTypeMap = function () {
        return EstimateFA12TransferFeeTezos401Response.attributeTypeMap;
    };
    EstimateFA12TransferFeeTezos401Response.discriminator = undefined;
    EstimateFA12TransferFeeTezos401Response.attributeTypeMap = [
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
            "type": "EstimateFA12TransferFeeTezosE401"
        }
    ];
    return EstimateFA12TransferFeeTezos401Response;
}());
exports.EstimateFA12TransferFeeTezos401Response = EstimateFA12TransferFeeTezos401Response;
//# sourceMappingURL=estimateFA12TransferFeeTezos401Response.js.map