"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EstimateTransactionSmartFeeUTXOsE400 = void 0;
var EstimateTransactionSmartFeeUTXOsE400 = (function () {
    function EstimateTransactionSmartFeeUTXOsE400() {
    }
    EstimateTransactionSmartFeeUTXOsE400.getAttributeTypeMap = function () {
        return EstimateTransactionSmartFeeUTXOsE400.attributeTypeMap;
    };
    EstimateTransactionSmartFeeUTXOsE400.discriminator = undefined;
    EstimateTransactionSmartFeeUTXOsE400.attributeTypeMap = [
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
    return EstimateTransactionSmartFeeUTXOsE400;
}());
exports.EstimateTransactionSmartFeeUTXOsE400 = EstimateTransactionSmartFeeUTXOsE400;
//# sourceMappingURL=estimateTransactionSmartFeeUTXOsE400.js.map