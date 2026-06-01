"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EstimateTransferFeeTezosR = void 0;
var EstimateTransferFeeTezosR = (function () {
    function EstimateTransferFeeTezosR() {
    }
    EstimateTransferFeeTezosR.getAttributeTypeMap = function () {
        return EstimateTransferFeeTezosR.attributeTypeMap;
    };
    EstimateTransferFeeTezosR.discriminator = undefined;
    EstimateTransferFeeTezosR.attributeTypeMap = [
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
            "type": "EstimateTransferFeeTezosRData"
        }
    ];
    return EstimateTransferFeeTezosR;
}());
exports.EstimateTransferFeeTezosR = EstimateTransferFeeTezosR;
//# sourceMappingURL=estimateTransferFeeTezosR.js.map