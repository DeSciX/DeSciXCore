"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BroadcastLocallySignedTransactionE401 = void 0;
var BroadcastLocallySignedTransactionE401 = (function () {
    function BroadcastLocallySignedTransactionE401() {
    }
    BroadcastLocallySignedTransactionE401.getAttributeTypeMap = function () {
        return BroadcastLocallySignedTransactionE401.attributeTypeMap;
    };
    BroadcastLocallySignedTransactionE401.discriminator = undefined;
    BroadcastLocallySignedTransactionE401.attributeTypeMap = [
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
    return BroadcastLocallySignedTransactionE401;
}());
exports.BroadcastLocallySignedTransactionE401 = BroadcastLocallySignedTransactionE401;
//# sourceMappingURL=broadcastLocallySignedTransactionE401.js.map