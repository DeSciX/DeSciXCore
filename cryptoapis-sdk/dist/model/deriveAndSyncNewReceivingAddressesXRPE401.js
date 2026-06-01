"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeriveAndSyncNewReceivingAddressesXRPE401 = void 0;
var DeriveAndSyncNewReceivingAddressesXRPE401 = (function () {
    function DeriveAndSyncNewReceivingAddressesXRPE401() {
    }
    DeriveAndSyncNewReceivingAddressesXRPE401.getAttributeTypeMap = function () {
        return DeriveAndSyncNewReceivingAddressesXRPE401.attributeTypeMap;
    };
    DeriveAndSyncNewReceivingAddressesXRPE401.discriminator = undefined;
    DeriveAndSyncNewReceivingAddressesXRPE401.attributeTypeMap = [
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
    return DeriveAndSyncNewReceivingAddressesXRPE401;
}());
exports.DeriveAndSyncNewReceivingAddressesXRPE401 = DeriveAndSyncNewReceivingAddressesXRPE401;
//# sourceMappingURL=deriveAndSyncNewReceivingAddressesXRPE401.js.map