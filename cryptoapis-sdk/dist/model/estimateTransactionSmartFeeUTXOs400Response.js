"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EstimateTransactionSmartFeeUTXOs400Response = void 0;
var EstimateTransactionSmartFeeUTXOs400Response = (function () {
    function EstimateTransactionSmartFeeUTXOs400Response() {
    }
    EstimateTransactionSmartFeeUTXOs400Response.getAttributeTypeMap = function () {
        return EstimateTransactionSmartFeeUTXOs400Response.attributeTypeMap;
    };
    EstimateTransactionSmartFeeUTXOs400Response.discriminator = undefined;
    EstimateTransactionSmartFeeUTXOs400Response.attributeTypeMap = [
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
            "type": "EstimateTransactionSmartFeeUTXOsE400"
        }
    ];
    return EstimateTransactionSmartFeeUTXOs400Response;
}());
exports.EstimateTransactionSmartFeeUTXOs400Response = EstimateTransactionSmartFeeUTXOs400Response;
//# sourceMappingURL=estimateTransactionSmartFeeUTXOs400Response.js.map