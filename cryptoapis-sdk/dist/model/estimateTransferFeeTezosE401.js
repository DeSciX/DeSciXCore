"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EstimateTransferFeeTezosE401 = void 0;
var EstimateTransferFeeTezosE401 = (function () {
    function EstimateTransferFeeTezosE401() {
    }
    EstimateTransferFeeTezosE401.getAttributeTypeMap = function () {
        return EstimateTransferFeeTezosE401.attributeTypeMap;
    };
    EstimateTransferFeeTezosE401.discriminator = undefined;
    EstimateTransferFeeTezosE401.attributeTypeMap = [
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
    return EstimateTransferFeeTezosE401;
}());
exports.EstimateTransferFeeTezosE401 = EstimateTransferFeeTezosE401;
//# sourceMappingURL=estimateTransferFeeTezosE401.js.map