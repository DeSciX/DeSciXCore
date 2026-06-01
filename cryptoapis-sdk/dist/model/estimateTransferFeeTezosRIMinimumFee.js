"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EstimateTransferFeeTezosRIMinimumFee = void 0;
var EstimateTransferFeeTezosRIMinimumFee = (function () {
    function EstimateTransferFeeTezosRIMinimumFee() {
    }
    EstimateTransferFeeTezosRIMinimumFee.getAttributeTypeMap = function () {
        return EstimateTransferFeeTezosRIMinimumFee.attributeTypeMap;
    };
    EstimateTransferFeeTezosRIMinimumFee.discriminator = undefined;
    EstimateTransferFeeTezosRIMinimumFee.attributeTypeMap = [
        {
            "name": "fast",
            "baseName": "fast",
            "type": "string"
        },
        {
            "name": "slow",
            "baseName": "slow",
            "type": "string"
        },
        {
            "name": "standard",
            "baseName": "standard",
            "type": "string"
        },
        {
            "name": "unit",
            "baseName": "unit",
            "type": "string"
        }
    ];
    return EstimateTransferFeeTezosRIMinimumFee;
}());
exports.EstimateTransferFeeTezosRIMinimumFee = EstimateTransferFeeTezosRIMinimumFee;
//# sourceMappingURL=estimateTransferFeeTezosRIMinimumFee.js.map