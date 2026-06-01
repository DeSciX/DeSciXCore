"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EstimateFA2TransferFeeTezosRBDataItem = void 0;
var EstimateFA2TransferFeeTezosRBDataItem = (function () {
    function EstimateFA2TransferFeeTezosRBDataItem() {
    }
    EstimateFA2TransferFeeTezosRBDataItem.getAttributeTypeMap = function () {
        return EstimateFA2TransferFeeTezosRBDataItem.attributeTypeMap;
    };
    EstimateFA2TransferFeeTezosRBDataItem.discriminator = undefined;
    EstimateFA2TransferFeeTezosRBDataItem.attributeTypeMap = [
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
        },
        {
            "name": "tokenId",
            "baseName": "tokenId",
            "type": "number"
        }
    ];
    return EstimateFA2TransferFeeTezosRBDataItem;
}());
exports.EstimateFA2TransferFeeTezosRBDataItem = EstimateFA2TransferFeeTezosRBDataItem;
//# sourceMappingURL=estimateFA2TransferFeeTezosRBDataItem.js.map