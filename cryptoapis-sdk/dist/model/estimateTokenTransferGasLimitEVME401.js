"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EstimateTokenTransferGasLimitEVME401 = void 0;
var EstimateTokenTransferGasLimitEVME401 = (function () {
    function EstimateTokenTransferGasLimitEVME401() {
    }
    EstimateTokenTransferGasLimitEVME401.getAttributeTypeMap = function () {
        return EstimateTokenTransferGasLimitEVME401.attributeTypeMap;
    };
    EstimateTokenTransferGasLimitEVME401.discriminator = undefined;
    EstimateTokenTransferGasLimitEVME401.attributeTypeMap = [
        {
            "name": "code",
            "baseName": "code",
            "type": "string"
        },
        {
            "name": "message",
            "baseName": "message",
            "type": "string"
        },
        {
            "name": "details",
            "baseName": "details",
            "type": "Array<BannedIpAddressDetailsInner>"
        }
    ];
    return EstimateTokenTransferGasLimitEVME401;
}());
exports.EstimateTokenTransferGasLimitEVME401 = EstimateTokenTransferGasLimitEVME401;
//# sourceMappingURL=estimateTokenTransferGasLimitEVME401.js.map