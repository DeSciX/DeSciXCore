"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EstimateTransactionSmartFeeUTXOsRI = void 0;
var EstimateTransactionSmartFeeUTXOsRI = (function () {
    function EstimateTransactionSmartFeeUTXOsRI() {
    }
    EstimateTransactionSmartFeeUTXOsRI.getAttributeTypeMap = function () {
        return EstimateTransactionSmartFeeUTXOsRI.attributeTypeMap;
    };
    EstimateTransactionSmartFeeUTXOsRI.discriminator = undefined;
    EstimateTransactionSmartFeeUTXOsRI.attributeTypeMap = [
        {
            "name": "confirmationTarget",
            "baseName": "confirmationTarget",
            "type": "number"
        },
        {
            "name": "feeRate",
            "baseName": "feeRate",
            "type": "string"
        },
        {
            "name": "unit",
            "baseName": "unit",
            "type": "string"
        }
    ];
    return EstimateTransactionSmartFeeUTXOsRI;
}());
exports.EstimateTransactionSmartFeeUTXOsRI = EstimateTransactionSmartFeeUTXOsRI;
//# sourceMappingURL=estimateTransactionSmartFeeUTXOsRI.js.map