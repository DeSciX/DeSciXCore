"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EstimateTransactionSmartFeeUTXOsR = void 0;
var EstimateTransactionSmartFeeUTXOsR = (function () {
    function EstimateTransactionSmartFeeUTXOsR() {
    }
    EstimateTransactionSmartFeeUTXOsR.getAttributeTypeMap = function () {
        return EstimateTransactionSmartFeeUTXOsR.attributeTypeMap;
    };
    EstimateTransactionSmartFeeUTXOsR.discriminator = undefined;
    EstimateTransactionSmartFeeUTXOsR.attributeTypeMap = [
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
            "name": "data",
            "baseName": "data",
            "type": "EstimateTransactionSmartFeeUTXOsRData"
        }
    ];
    return EstimateTransactionSmartFeeUTXOsR;
}());
exports.EstimateTransactionSmartFeeUTXOsR = EstimateTransactionSmartFeeUTXOsR;
//# sourceMappingURL=estimateTransactionSmartFeeUTXOsR.js.map