"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncHDWalletXPubYPubZPub422Response = void 0;
var SyncHDWalletXPubYPubZPub422Response = (function () {
    function SyncHDWalletXPubYPubZPub422Response() {
    }
    SyncHDWalletXPubYPubZPub422Response.getAttributeTypeMap = function () {
        return SyncHDWalletXPubYPubZPub422Response.attributeTypeMap;
    };
    SyncHDWalletXPubYPubZPub422Response.discriminator = undefined;
    SyncHDWalletXPubYPubZPub422Response.attributeTypeMap = [
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
            "type": "SyncHDWalletXPubYPubZPubE422"
        }
    ];
    return SyncHDWalletXPubYPubZPub422Response;
}());
exports.SyncHDWalletXPubYPubZPub422Response = SyncHDWalletXPubYPubZPub422Response;
//# sourceMappingURL=syncHDWalletXPubYPubZPub422Response.js.map