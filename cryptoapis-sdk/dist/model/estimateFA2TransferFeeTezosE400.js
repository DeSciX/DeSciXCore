"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EstimateFA2TransferFeeTezosE400 = void 0;
var EstimateFA2TransferFeeTezosE400 = (function () {
    function EstimateFA2TransferFeeTezosE400() {
    }
    EstimateFA2TransferFeeTezosE400.getAttributeTypeMap = function () {
        return EstimateFA2TransferFeeTezosE400.attributeTypeMap;
    };
    EstimateFA2TransferFeeTezosE400.discriminator = undefined;
    EstimateFA2TransferFeeTezosE400.attributeTypeMap = [
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
    return EstimateFA2TransferFeeTezosE400;
}());
exports.EstimateFA2TransferFeeTezosE400 = EstimateFA2TransferFeeTezosE400;
//# sourceMappingURL=estimateFA2TransferFeeTezosE400.js.map