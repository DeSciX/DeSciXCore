"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivateSyncedAddressRB = void 0;
var ActivateSyncedAddressRB = (function () {
    function ActivateSyncedAddressRB() {
    }
    ActivateSyncedAddressRB.getAttributeTypeMap = function () {
        return ActivateSyncedAddressRB.attributeTypeMap;
    };
    ActivateSyncedAddressRB.discriminator = undefined;
    ActivateSyncedAddressRB.attributeTypeMap = [
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
    return ActivateSyncedAddressRB;
}());
exports.ActivateSyncedAddressRB = ActivateSyncedAddressRB;
//# sourceMappingURL=activateSyncedAddressRB.js.map