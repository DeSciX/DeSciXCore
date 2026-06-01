"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EstimateTransferFeeTezosRI = void 0;
var EstimateTransferFeeTezosRI = (function () {
    function EstimateTransferFeeTezosRI() {
    }
    EstimateTransferFeeTezosRI.getAttributeTypeMap = function () {
        return EstimateTransferFeeTezosRI.attributeTypeMap;
    };
    EstimateTransferFeeTezosRI.discriminator = undefined;
    EstimateTransferFeeTezosRI.attributeTypeMap = [
        {
            "name": "gasLimit",
            "baseName": "gasLimit",
            "type": "number"
        },
        {
            "name": "includesReveal",
            "baseName": "includesReveal",
            "type": "boolean"
        },
        {
            "name": "storageBurnEstimate",
            "baseName": "storageBurnEstimate",
            "type": "number"
        },
        {
            "name": "storageLimit",
            "baseName": "storageLimit",
            "type": "number"
        },
        {
            "name": "minimumFee",
            "baseName": "minimumFee",
            "type": "EstimateTransferFeeTezosRIMinimumFee"
        }
    ];
    return EstimateTransferFeeTezosRI;
}());
exports.EstimateTransferFeeTezosRI = EstimateTransferFeeTezosRI;
//# sourceMappingURL=estimateTransferFeeTezosRI.js.map