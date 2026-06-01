"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EstimateNativeCoinTransferGasLimitEVMRBDataItem = void 0;
var EstimateNativeCoinTransferGasLimitEVMRBDataItem = (function () {
    function EstimateNativeCoinTransferGasLimitEVMRBDataItem() {
    }
    EstimateNativeCoinTransferGasLimitEVMRBDataItem.getAttributeTypeMap = function () {
        return EstimateNativeCoinTransferGasLimitEVMRBDataItem.attributeTypeMap;
    };
    EstimateNativeCoinTransferGasLimitEVMRBDataItem.discriminator = undefined;
    EstimateNativeCoinTransferGasLimitEVMRBDataItem.attributeTypeMap = [
        {
            "name": "additionalData",
            "baseName": "additionalData",
            "type": "string"
        },
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
        }
    ];
    return EstimateNativeCoinTransferGasLimitEVMRBDataItem;
}());
exports.EstimateNativeCoinTransferGasLimitEVMRBDataItem = EstimateNativeCoinTransferGasLimitEVMRBDataItem;
//# sourceMappingURL=estimateNativeCoinTransferGasLimitEVMRBDataItem.js.map