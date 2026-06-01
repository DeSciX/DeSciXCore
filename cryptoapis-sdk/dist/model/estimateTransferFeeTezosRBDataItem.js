"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EstimateTransferFeeTezosRBDataItem = void 0;
var EstimateTransferFeeTezosRBDataItem = (function () {
    function EstimateTransferFeeTezosRBDataItem() {
    }
    EstimateTransferFeeTezosRBDataItem.getAttributeTypeMap = function () {
        return EstimateTransferFeeTezosRBDataItem.attributeTypeMap;
    };
    EstimateTransferFeeTezosRBDataItem.discriminator = undefined;
    EstimateTransferFeeTezosRBDataItem.attributeTypeMap = [
        {
            "name": "amount",
            "baseName": "amount",
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
    return EstimateTransferFeeTezosRBDataItem;
}());
exports.EstimateTransferFeeTezosRBDataItem = EstimateTransferFeeTezosRBDataItem;
//# sourceMappingURL=estimateTransferFeeTezosRBDataItem.js.map