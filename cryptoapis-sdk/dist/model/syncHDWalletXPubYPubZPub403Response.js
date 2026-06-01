"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncHDWalletXPubYPubZPub403Response = void 0;
var SyncHDWalletXPubYPubZPub403Response = (function () {
    function SyncHDWalletXPubYPubZPub403Response() {
    }
    SyncHDWalletXPubYPubZPub403Response.getAttributeTypeMap = function () {
        return SyncHDWalletXPubYPubZPub403Response.attributeTypeMap;
    };
    SyncHDWalletXPubYPubZPub403Response.discriminator = undefined;
    SyncHDWalletXPubYPubZPub403Response.attributeTypeMap = [
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
            "type": "SyncHDWalletXPubYPubZPubE403"
        }
    ];
    return SyncHDWalletXPubYPubZPub403Response;
}());
exports.SyncHDWalletXPubYPubZPub403Response = SyncHDWalletXPubYPubZPub403Response;
//# sourceMappingURL=syncHDWalletXPubYPubZPub403Response.js.map