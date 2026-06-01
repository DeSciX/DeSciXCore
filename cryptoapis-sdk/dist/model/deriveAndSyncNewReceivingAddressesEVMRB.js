"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeriveAndSyncNewReceivingAddressesEVMRB = void 0;
var DeriveAndSyncNewReceivingAddressesEVMRB = (function () {
    function DeriveAndSyncNewReceivingAddressesEVMRB() {
    }
    DeriveAndSyncNewReceivingAddressesEVMRB.getAttributeTypeMap = function () {
        return DeriveAndSyncNewReceivingAddressesEVMRB.attributeTypeMap;
    };
    DeriveAndSyncNewReceivingAddressesEVMRB.discriminator = undefined;
    DeriveAndSyncNewReceivingAddressesEVMRB.attributeTypeMap = [
        {
            "name": "context",
            "baseName": "context",
            "type": "string"
        },
        {
            "name": "data",
            "baseName": "data",
            "type": "SyncHDWalletXPubYPubZPubRBData"
        }
    ];
    return DeriveAndSyncNewReceivingAddressesEVMRB;
}());
exports.DeriveAndSyncNewReceivingAddressesEVMRB = DeriveAndSyncNewReceivingAddressesEVMRB;
//# sourceMappingURL=deriveAndSyncNewReceivingAddressesEVMRB.js.map