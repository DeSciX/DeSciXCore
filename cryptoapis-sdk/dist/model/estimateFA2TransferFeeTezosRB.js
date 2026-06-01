"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EstimateFA2TransferFeeTezosRB = void 0;
var EstimateFA2TransferFeeTezosRB = (function () {
    function EstimateFA2TransferFeeTezosRB() {
    }
    EstimateFA2TransferFeeTezosRB.getAttributeTypeMap = function () {
        return EstimateFA2TransferFeeTezosRB.attributeTypeMap;
    };
    EstimateFA2TransferFeeTezosRB.discriminator = undefined;
    EstimateFA2TransferFeeTezosRB.attributeTypeMap = [
        {
            "name": "context",
            "baseName": "context",
            "type": "string"
        },
        {
            "name": "data",
            "baseName": "data",
            "type": "EstimateFA2TransferFeeTezosRBData"
        }
    ];
    return EstimateFA2TransferFeeTezosRB;
}());
exports.EstimateFA2TransferFeeTezosRB = EstimateFA2TransferFeeTezosRB;
//# sourceMappingURL=estimateFA2TransferFeeTezosRB.js.map