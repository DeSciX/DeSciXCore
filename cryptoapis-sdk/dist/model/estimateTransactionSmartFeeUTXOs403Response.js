"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EstimateTransactionSmartFeeUTXOs403Response = void 0;
var EstimateTransactionSmartFeeUTXOs403Response = (function () {
    function EstimateTransactionSmartFeeUTXOs403Response() {
    }
    EstimateTransactionSmartFeeUTXOs403Response.getAttributeTypeMap = function () {
        return EstimateTransactionSmartFeeUTXOs403Response.attributeTypeMap;
    };
    EstimateTransactionSmartFeeUTXOs403Response.discriminator = undefined;
    EstimateTransactionSmartFeeUTXOs403Response.attributeTypeMap = [
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
            "type": "EstimateTransactionSmartFeeUTXOsE403"
        }
    ];
    return EstimateTransactionSmartFeeUTXOs403Response;
}());
exports.EstimateTransactionSmartFeeUTXOs403Response = EstimateTransactionSmartFeeUTXOs403Response;
//# sourceMappingURL=estimateTransactionSmartFeeUTXOs403Response.js.map