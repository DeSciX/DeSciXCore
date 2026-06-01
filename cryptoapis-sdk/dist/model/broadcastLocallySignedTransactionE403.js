"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BroadcastLocallySignedTransactionE403 = void 0;
var BroadcastLocallySignedTransactionE403 = (function () {
    function BroadcastLocallySignedTransactionE403() {
    }
    BroadcastLocallySignedTransactionE403.getAttributeTypeMap = function () {
        return BroadcastLocallySignedTransactionE403.attributeTypeMap;
    };
    BroadcastLocallySignedTransactionE403.discriminator = undefined;
    BroadcastLocallySignedTransactionE403.attributeTypeMap = [
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
    return BroadcastLocallySignedTransactionE403;
}());
exports.BroadcastLocallySignedTransactionE403 = BroadcastLocallySignedTransactionE403;
//# sourceMappingURL=broadcastLocallySignedTransactionE403.js.map