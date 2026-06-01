"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EstimateFA12TransferFeeTezosRBDataItem = void 0;
var EstimateFA12TransferFeeTezosRBDataItem = (function () {
    function EstimateFA12TransferFeeTezosRBDataItem() {
    }
    EstimateFA12TransferFeeTezosRBDataItem.getAttributeTypeMap = function () {
        return EstimateFA12TransferFeeTezosRBDataItem.attributeTypeMap;
    };
    EstimateFA12TransferFeeTezosRBDataItem.discriminator = undefined;
    EstimateFA12TransferFeeTezosRBDataItem.attributeTypeMap = [
        {
            "name": "amount",
            "baseName": "amount",
            "type": "string"
        },
        {
            "name": "contractAddress",
            "baseName": "contractAddress",
            "type": "string"
        },
        {
            "name": "recipient",
            "baseName": "recipient",
            "type": "string"
        },
        {
            "name": "sender",
            "baseName": "sender",
            "type": "string"
        },
        {
            "name": "senderPublicKey",
            "baseName": "senderPublicKey",
            "type": "string"
        }
    ];
    return EstimateFA12TransferFeeTezosRBDataItem;
}());
exports.EstimateFA12TransferFeeTezosRBDataItem = EstimateFA12TransferFeeTezosRBDataItem;
//# sourceMappingURL=estimateFA12TransferFeeTezosRBDataItem.js.map