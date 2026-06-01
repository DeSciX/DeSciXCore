"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeriveAndSyncNewReceivingAddressesEVME400 = void 0;
var DeriveAndSyncNewReceivingAddressesEVME400 = (function () {
    function DeriveAndSyncNewReceivingAddressesEVME400() {
    }
    DeriveAndSyncNewReceivingAddressesEVME400.getAttributeTypeMap = function () {
        return DeriveAndSyncNewReceivingAddressesEVME400.attributeTypeMap;
    };
    DeriveAndSyncNewReceivingAddressesEVME400.discriminator = undefined;
    DeriveAndSyncNewReceivingAddressesEVME400.attributeTypeMap = [
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
    return DeriveAndSyncNewReceivingAddressesEVME400;
}());
exports.DeriveAndSyncNewReceivingAddressesEVME400 = DeriveAndSyncNewReceivingAddressesEVME400;
//# sourceMappingURL=deriveAndSyncNewReceivingAddressesEVME400.js.map