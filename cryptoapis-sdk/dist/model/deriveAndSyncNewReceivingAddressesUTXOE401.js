"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeriveAndSyncNewReceivingAddressesUTXOE401 = void 0;
var DeriveAndSyncNewReceivingAddressesUTXOE401 = (function () {
    function DeriveAndSyncNewReceivingAddressesUTXOE401() {
    }
    DeriveAndSyncNewReceivingAddressesUTXOE401.getAttributeTypeMap = function () {
        return DeriveAndSyncNewReceivingAddressesUTXOE401.attributeTypeMap;
    };
    DeriveAndSyncNewReceivingAddressesUTXOE401.discriminator = undefined;
    DeriveAndSyncNewReceivingAddressesUTXOE401.attributeTypeMap = [
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
    return DeriveAndSyncNewReceivingAddressesUTXOE401;
}());
exports.DeriveAndSyncNewReceivingAddressesUTXOE401 = DeriveAndSyncNewReceivingAddressesUTXOE401;
//# sourceMappingURL=deriveAndSyncNewReceivingAddressesUTXOE401.js.map