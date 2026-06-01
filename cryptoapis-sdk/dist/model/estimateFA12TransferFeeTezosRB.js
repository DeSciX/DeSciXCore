"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EstimateFA12TransferFeeTezosRB = void 0;
var EstimateFA12TransferFeeTezosRB = (function () {
    function EstimateFA12TransferFeeTezosRB() {
    }
    EstimateFA12TransferFeeTezosRB.getAttributeTypeMap = function () {
        return EstimateFA12TransferFeeTezosRB.attributeTypeMap;
    };
    EstimateFA12TransferFeeTezosRB.discriminator = undefined;
    EstimateFA12TransferFeeTezosRB.attributeTypeMap = [
        {
            "name": "context",
            "baseName": "context",
            "type": "string"
        },
        {
            "name": "data",
            "baseName": "data",
            "type": "EstimateFA12TransferFeeTezosRBData"
        }
    ];
    return EstimateFA12TransferFeeTezosRB;
}());
exports.EstimateFA12TransferFeeTezosRB = EstimateFA12TransferFeeTezosRB;
//# sourceMappingURL=estimateFA12TransferFeeTezosRB.js.map