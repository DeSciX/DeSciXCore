"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EstimateTransactionSmartFeeUTXOsE401 = void 0;
var EstimateTransactionSmartFeeUTXOsE401 = (function () {
    function EstimateTransactionSmartFeeUTXOsE401() {
    }
    EstimateTransactionSmartFeeUTXOsE401.getAttributeTypeMap = function () {
        return EstimateTransactionSmartFeeUTXOsE401.attributeTypeMap;
    };
    EstimateTransactionSmartFeeUTXOsE401.discriminator = undefined;
    EstimateTransactionSmartFeeUTXOsE401.attributeTypeMap = [
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
    return EstimateTransactionSmartFeeUTXOsE401;
}());
exports.EstimateTransactionSmartFeeUTXOsE401 = EstimateTransactionSmartFeeUTXOsE401;
//# sourceMappingURL=estimateTransactionSmartFeeUTXOsE401.js.map