"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeriveAndSyncNewReceivingAddressesXRPE400 = void 0;
var DeriveAndSyncNewReceivingAddressesXRPE400 = (function () {
    function DeriveAndSyncNewReceivingAddressesXRPE400() {
    }
    DeriveAndSyncNewReceivingAddressesXRPE400.getAttributeTypeMap = function () {
        return DeriveAndSyncNewReceivingAddressesXRPE400.attributeTypeMap;
    };
    DeriveAndSyncNewReceivingAddressesXRPE400.discriminator = undefined;
    DeriveAndSyncNewReceivingAddressesXRPE400.attributeTypeMap = [
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
    return DeriveAndSyncNewReceivingAddressesXRPE400;
}());
exports.DeriveAndSyncNewReceivingAddressesXRPE400 = DeriveAndSyncNewReceivingAddressesXRPE400;
//# sourceMappingURL=deriveAndSyncNewReceivingAddressesXRPE400.js.map