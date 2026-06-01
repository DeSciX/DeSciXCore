"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EstimateTransferFeeTezosE400 = void 0;
var EstimateTransferFeeTezosE400 = (function () {
    function EstimateTransferFeeTezosE400() {
    }
    EstimateTransferFeeTezosE400.getAttributeTypeMap = function () {
        return EstimateTransferFeeTezosE400.attributeTypeMap;
    };
    EstimateTransferFeeTezosE400.discriminator = undefined;
    EstimateTransferFeeTezosE400.attributeTypeMap = [
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
    return EstimateTransferFeeTezosE400;
}());
exports.EstimateTransferFeeTezosE400 = EstimateTransferFeeTezosE400;
//# sourceMappingURL=estimateTransferFeeTezosE400.js.map