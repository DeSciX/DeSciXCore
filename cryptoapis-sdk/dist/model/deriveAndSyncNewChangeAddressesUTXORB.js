"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeriveAndSyncNewChangeAddressesUTXORB = void 0;
var DeriveAndSyncNewChangeAddressesUTXORB = (function () {
    function DeriveAndSyncNewChangeAddressesUTXORB() {
    }
    DeriveAndSyncNewChangeAddressesUTXORB.getAttributeTypeMap = function () {
        return DeriveAndSyncNewChangeAddressesUTXORB.attributeTypeMap;
    };
    DeriveAndSyncNewChangeAddressesUTXORB.discriminator = undefined;
    DeriveAndSyncNewChangeAddressesUTXORB.attributeTypeMap = [
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
    return DeriveAndSyncNewChangeAddressesUTXORB;
}());
exports.DeriveAndSyncNewChangeAddressesUTXORB = DeriveAndSyncNewChangeAddressesUTXORB;
//# sourceMappingURL=deriveAndSyncNewChangeAddressesUTXORB.js.map