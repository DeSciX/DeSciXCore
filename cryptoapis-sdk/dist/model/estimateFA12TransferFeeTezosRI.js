"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EstimateFA12TransferFeeTezosRI = void 0;
var EstimateFA12TransferFeeTezosRI = (function () {
    function EstimateFA12TransferFeeTezosRI() {
    }
    EstimateFA12TransferFeeTezosRI.getAttributeTypeMap = function () {
        return EstimateFA12TransferFeeTezosRI.attributeTypeMap;
    };
    EstimateFA12TransferFeeTezosRI.discriminator = undefined;
    EstimateFA12TransferFeeTezosRI.attributeTypeMap = [
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
    return EstimateFA12TransferFeeTezosRI;
}());
exports.EstimateFA12TransferFeeTezosRI = EstimateFA12TransferFeeTezosRI;
//# sourceMappingURL=estimateFA12TransferFeeTezosRI.js.map