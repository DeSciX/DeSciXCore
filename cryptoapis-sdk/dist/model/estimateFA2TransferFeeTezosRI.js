"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EstimateFA2TransferFeeTezosRI = void 0;
var EstimateFA2TransferFeeTezosRI = (function () {
    function EstimateFA2TransferFeeTezosRI() {
    }
    EstimateFA2TransferFeeTezosRI.getAttributeTypeMap = function () {
        return EstimateFA2TransferFeeTezosRI.attributeTypeMap;
    };
    EstimateFA2TransferFeeTezosRI.discriminator = undefined;
    EstimateFA2TransferFeeTezosRI.attributeTypeMap = [
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
    return EstimateFA2TransferFeeTezosRI;
}());
exports.EstimateFA2TransferFeeTezosRI = EstimateFA2TransferFeeTezosRI;
//# sourceMappingURL=estimateFA2TransferFeeTezosRI.js.map