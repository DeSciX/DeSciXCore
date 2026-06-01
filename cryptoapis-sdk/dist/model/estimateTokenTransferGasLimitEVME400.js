"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EstimateTokenTransferGasLimitEVME400 = void 0;
var EstimateTokenTransferGasLimitEVME400 = (function () {
    function EstimateTokenTransferGasLimitEVME400() {
    }
    EstimateTokenTransferGasLimitEVME400.getAttributeTypeMap = function () {
        return EstimateTokenTransferGasLimitEVME400.attributeTypeMap;
    };
    EstimateTokenTransferGasLimitEVME400.discriminator = undefined;
    EstimateTokenTransferGasLimitEVME400.attributeTypeMap = [
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
    return EstimateTokenTransferGasLimitEVME400;
}());
exports.EstimateTokenTransferGasLimitEVME400 = EstimateTokenTransferGasLimitEVME400;
//# sourceMappingURL=estimateTokenTransferGasLimitEVME400.js.map