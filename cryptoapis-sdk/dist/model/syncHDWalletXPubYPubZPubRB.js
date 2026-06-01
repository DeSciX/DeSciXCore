"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncHDWalletXPubYPubZPubRB = void 0;
var SyncHDWalletXPubYPubZPubRB = (function () {
    function SyncHDWalletXPubYPubZPubRB() {
    }
    SyncHDWalletXPubYPubZPubRB.getAttributeTypeMap = function () {
        return SyncHDWalletXPubYPubZPubRB.attributeTypeMap;
    };
    SyncHDWalletXPubYPubZPubRB.discriminator = undefined;
    SyncHDWalletXPubYPubZPubRB.attributeTypeMap = [
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
    return SyncHDWalletXPubYPubZPubRB;
}());
exports.SyncHDWalletXPubYPubZPubRB = SyncHDWalletXPubYPubZPubRB;
//# sourceMappingURL=syncHDWalletXPubYPubZPubRB.js.map