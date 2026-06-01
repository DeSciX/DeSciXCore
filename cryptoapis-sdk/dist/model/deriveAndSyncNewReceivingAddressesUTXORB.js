"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeriveAndSyncNewReceivingAddressesUTXORB = void 0;
var DeriveAndSyncNewReceivingAddressesUTXORB = (function () {
    function DeriveAndSyncNewReceivingAddressesUTXORB() {
    }
    DeriveAndSyncNewReceivingAddressesUTXORB.getAttributeTypeMap = function () {
        return DeriveAndSyncNewReceivingAddressesUTXORB.attributeTypeMap;
    };
    DeriveAndSyncNewReceivingAddressesUTXORB.discriminator = undefined;
    DeriveAndSyncNewReceivingAddressesUTXORB.attributeTypeMap = [
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
    return DeriveAndSyncNewReceivingAddressesUTXORB;
}());
exports.DeriveAndSyncNewReceivingAddressesUTXORB = DeriveAndSyncNewReceivingAddressesUTXORB;
//# sourceMappingURL=deriveAndSyncNewReceivingAddressesUTXORB.js.map