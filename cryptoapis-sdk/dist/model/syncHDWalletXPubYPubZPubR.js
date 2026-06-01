"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncHDWalletXPubYPubZPubR = void 0;
var SyncHDWalletXPubYPubZPubR = (function () {
    function SyncHDWalletXPubYPubZPubR() {
    }
    SyncHDWalletXPubYPubZPubR.getAttributeTypeMap = function () {
        return SyncHDWalletXPubYPubZPubR.attributeTypeMap;
    };
    SyncHDWalletXPubYPubZPubR.discriminator = undefined;
    SyncHDWalletXPubYPubZPubR.attributeTypeMap = [
        {
            "name": "apiVersion",
            "baseName": "apiVersion",
            "type": "string"
        },
        {
            "name": "requestId",
            "baseName": "requestId",
            "type": "string"
        },
        {
            "name": "context",
            "baseName": "context",
            "type": "string"
        },
        {
            "name": "data",
            "baseName": "data",
            "type": "SyncHDWalletXPubYPubZPubRData"
        }
    ];
    return SyncHDWalletXPubYPubZPubR;
}());
exports.SyncHDWalletXPubYPubZPubR = SyncHDWalletXPubYPubZPubR;
//# sourceMappingURL=syncHDWalletXPubYPubZPubR.js.map