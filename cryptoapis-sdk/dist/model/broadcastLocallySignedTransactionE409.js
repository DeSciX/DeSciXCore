"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BroadcastLocallySignedTransactionE409 = void 0;
var BroadcastLocallySignedTransactionE409 = (function () {
    function BroadcastLocallySignedTransactionE409() {
    }
    BroadcastLocallySignedTransactionE409.getAttributeTypeMap = function () {
        return BroadcastLocallySignedTransactionE409.attributeTypeMap;
    };
    BroadcastLocallySignedTransactionE409.discriminator = undefined;
    BroadcastLocallySignedTransactionE409.attributeTypeMap = [
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
    return BroadcastLocallySignedTransactionE409;
}());
exports.BroadcastLocallySignedTransactionE409 = BroadcastLocallySignedTransactionE409;
//# sourceMappingURL=broadcastLocallySignedTransactionE409.js.map