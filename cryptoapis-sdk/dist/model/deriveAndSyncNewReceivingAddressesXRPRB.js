"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeriveAndSyncNewReceivingAddressesXRPRB = void 0;
var DeriveAndSyncNewReceivingAddressesXRPRB = (function () {
    function DeriveAndSyncNewReceivingAddressesXRPRB() {
    }
    DeriveAndSyncNewReceivingAddressesXRPRB.getAttributeTypeMap = function () {
        return DeriveAndSyncNewReceivingAddressesXRPRB.attributeTypeMap;
    };
    DeriveAndSyncNewReceivingAddressesXRPRB.discriminator = undefined;
    DeriveAndSyncNewReceivingAddressesXRPRB.attributeTypeMap = [
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
    return DeriveAndSyncNewReceivingAddressesXRPRB;
}());
exports.DeriveAndSyncNewReceivingAddressesXRPRB = DeriveAndSyncNewReceivingAddressesXRPRB;
//# sourceMappingURL=deriveAndSyncNewReceivingAddressesXRPRB.js.map