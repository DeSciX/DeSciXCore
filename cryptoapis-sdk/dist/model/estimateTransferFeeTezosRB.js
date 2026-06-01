"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EstimateTransferFeeTezosRB = void 0;
var EstimateTransferFeeTezosRB = (function () {
    function EstimateTransferFeeTezosRB() {
    }
    EstimateTransferFeeTezosRB.getAttributeTypeMap = function () {
        return EstimateTransferFeeTezosRB.attributeTypeMap;
    };
    EstimateTransferFeeTezosRB.discriminator = undefined;
    EstimateTransferFeeTezosRB.attributeTypeMap = [
        {
            "name": "context",
            "baseName": "context",
            "type": "string"
        },
        {
            "name": "data",
            "baseName": "data",
            "type": "EstimateTransferFeeTezosRBData"
        }
    ];
    return EstimateTransferFeeTezosRB;
}());
exports.EstimateTransferFeeTezosRB = EstimateTransferFeeTezosRB;
//# sourceMappingURL=estimateTransferFeeTezosRB.js.map