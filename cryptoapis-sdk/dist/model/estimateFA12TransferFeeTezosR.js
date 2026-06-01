"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EstimateFA12TransferFeeTezosR = void 0;
var EstimateFA12TransferFeeTezosR = (function () {
    function EstimateFA12TransferFeeTezosR() {
    }
    EstimateFA12TransferFeeTezosR.getAttributeTypeMap = function () {
        return EstimateFA12TransferFeeTezosR.attributeTypeMap;
    };
    EstimateFA12TransferFeeTezosR.discriminator = undefined;
    EstimateFA12TransferFeeTezosR.attributeTypeMap = [
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
            "type": "EstimateFA12TransferFeeTezosRData"
        }
    ];
    return EstimateFA12TransferFeeTezosR;
}());
exports.EstimateFA12TransferFeeTezosR = EstimateFA12TransferFeeTezosR;
//# sourceMappingURL=estimateFA12TransferFeeTezosR.js.map