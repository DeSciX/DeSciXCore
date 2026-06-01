"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EstimateFA2TransferFeeTezosR = void 0;
var EstimateFA2TransferFeeTezosR = (function () {
    function EstimateFA2TransferFeeTezosR() {
    }
    EstimateFA2TransferFeeTezosR.getAttributeTypeMap = function () {
        return EstimateFA2TransferFeeTezosR.attributeTypeMap;
    };
    EstimateFA2TransferFeeTezosR.discriminator = undefined;
    EstimateFA2TransferFeeTezosR.attributeTypeMap = [
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
            "type": "EstimateFA2TransferFeeTezosRData"
        }
    ];
    return EstimateFA2TransferFeeTezosR;
}());
exports.EstimateFA2TransferFeeTezosR = EstimateFA2TransferFeeTezosR;
//# sourceMappingURL=estimateFA2TransferFeeTezosR.js.map