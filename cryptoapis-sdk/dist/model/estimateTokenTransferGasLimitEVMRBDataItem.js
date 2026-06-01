"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EstimateTokenTransferGasLimitEVMRBDataItem = void 0;
var EstimateTokenTransferGasLimitEVMRBDataItem = (function () {
    function EstimateTokenTransferGasLimitEVMRBDataItem() {
    }
    EstimateTokenTransferGasLimitEVMRBDataItem.getAttributeTypeMap = function () {
        return EstimateTokenTransferGasLimitEVMRBDataItem.attributeTypeMap;
    };
    EstimateTokenTransferGasLimitEVMRBDataItem.discriminator = undefined;
    EstimateTokenTransferGasLimitEVMRBDataItem.attributeTypeMap = [
        {
            "name": "amount",
            "baseName": "amount",
            "type": "string"
        },
        {
            "name": "contract",
            "baseName": "contract",
            "type": "string"
        },
        {
            "name": "contractType",
            "baseName": "contractType",
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
    return EstimateTokenTransferGasLimitEVMRBDataItem;
}());
exports.EstimateTokenTransferGasLimitEVMRBDataItem = EstimateTokenTransferGasLimitEVMRBDataItem;
//# sourceMappingURL=estimateTokenTransferGasLimitEVMRBDataItem.js.map