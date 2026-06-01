"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EstimateFA2TransferFeeTezosE401 = void 0;
var EstimateFA2TransferFeeTezosE401 = (function () {
    function EstimateFA2TransferFeeTezosE401() {
    }
    EstimateFA2TransferFeeTezosE401.getAttributeTypeMap = function () {
        return EstimateFA2TransferFeeTezosE401.attributeTypeMap;
    };
    EstimateFA2TransferFeeTezosE401.discriminator = undefined;
    EstimateFA2TransferFeeTezosE401.attributeTypeMap = [
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
    return EstimateFA2TransferFeeTezosE401;
}());
exports.EstimateFA2TransferFeeTezosE401 = EstimateFA2TransferFeeTezosE401;
//# sourceMappingURL=estimateFA2TransferFeeTezosE401.js.map