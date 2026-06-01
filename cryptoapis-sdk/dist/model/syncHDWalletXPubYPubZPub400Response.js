"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncHDWalletXPubYPubZPub400Response = void 0;
var SyncHDWalletXPubYPubZPub400Response = (function () {
    function SyncHDWalletXPubYPubZPub400Response() {
    }
    SyncHDWalletXPubYPubZPub400Response.getAttributeTypeMap = function () {
        return SyncHDWalletXPubYPubZPub400Response.attributeTypeMap;
    };
    SyncHDWalletXPubYPubZPub400Response.discriminator = undefined;
    SyncHDWalletXPubYPubZPub400Response.attributeTypeMap = [
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
            "name": "error",
            "baseName": "error",
            "type": "SyncHDWalletXPubYPubZPubE400"
        }
    ];
    return SyncHDWalletXPubYPubZPub400Response;
}());
exports.SyncHDWalletXPubYPubZPub400Response = SyncHDWalletXPubYPubZPub400Response;
//# sourceMappingURL=syncHDWalletXPubYPubZPub400Response.js.map