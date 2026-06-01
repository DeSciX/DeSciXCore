"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EstimateContractInteractionGasLimitEVME400 = void 0;
var EstimateContractInteractionGasLimitEVME400 = (function () {
    function EstimateContractInteractionGasLimitEVME400() {
    }
    EstimateContractInteractionGasLimitEVME400.getAttributeTypeMap = function () {
        return EstimateContractInteractionGasLimitEVME400.attributeTypeMap;
    };
    EstimateContractInteractionGasLimitEVME400.discriminator = undefined;
    EstimateContractInteractionGasLimitEVME400.attributeTypeMap = [
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
    return EstimateContractInteractionGasLimitEVME400;
}());
exports.EstimateContractInteractionGasLimitEVME400 = EstimateContractInteractionGasLimitEVME400;
//# sourceMappingURL=estimateContractInteractionGasLimitEVME400.js.map