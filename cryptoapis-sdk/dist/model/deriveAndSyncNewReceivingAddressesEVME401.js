"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeriveAndSyncNewReceivingAddressesEVME401 = void 0;
var DeriveAndSyncNewReceivingAddressesEVME401 = (function () {
    function DeriveAndSyncNewReceivingAddressesEVME401() {
    }
    DeriveAndSyncNewReceivingAddressesEVME401.getAttributeTypeMap = function () {
        return DeriveAndSyncNewReceivingAddressesEVME401.attributeTypeMap;
    };
    DeriveAndSyncNewReceivingAddressesEVME401.discriminator = undefined;
    DeriveAndSyncNewReceivingAddressesEVME401.attributeTypeMap = [
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
    return DeriveAndSyncNewReceivingAddressesEVME401;
}());
exports.DeriveAndSyncNewReceivingAddressesEVME401 = DeriveAndSyncNewReceivingAddressesEVME401;
//# sourceMappingURL=deriveAndSyncNewReceivingAddressesEVME401.js.map