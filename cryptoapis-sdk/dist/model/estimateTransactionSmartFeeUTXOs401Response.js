"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EstimateTransactionSmartFeeUTXOs401Response = void 0;
var EstimateTransactionSmartFeeUTXOs401Response = (function () {
    function EstimateTransactionSmartFeeUTXOs401Response() {
    }
    EstimateTransactionSmartFeeUTXOs401Response.getAttributeTypeMap = function () {
        return EstimateTransactionSmartFeeUTXOs401Response.attributeTypeMap;
    };
    EstimateTransactionSmartFeeUTXOs401Response.discriminator = undefined;
    EstimateTransactionSmartFeeUTXOs401Response.attributeTypeMap = [
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
            "type": "EstimateTransactionSmartFeeUTXOsE401"
        }
    ];
    return EstimateTransactionSmartFeeUTXOs401Response;
}());
exports.EstimateTransactionSmartFeeUTXOs401Response = EstimateTransactionSmartFeeUTXOs401Response;
//# sourceMappingURL=estimateTransactionSmartFeeUTXOs401Response.js.map