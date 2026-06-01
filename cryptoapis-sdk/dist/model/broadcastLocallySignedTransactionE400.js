"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BroadcastLocallySignedTransactionE400 = void 0;
var BroadcastLocallySignedTransactionE400 = (function () {
    function BroadcastLocallySignedTransactionE400() {
    }
    BroadcastLocallySignedTransactionE400.getAttributeTypeMap = function () {
        return BroadcastLocallySignedTransactionE400.attributeTypeMap;
    };
    BroadcastLocallySignedTransactionE400.discriminator = undefined;
    BroadcastLocallySignedTransactionE400.attributeTypeMap = [
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
    return BroadcastLocallySignedTransactionE400;
}());
exports.BroadcastLocallySignedTransactionE400 = BroadcastLocallySignedTransactionE400;
//# sourceMappingURL=broadcastLocallySignedTransactionE400.js.map