"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncHDWalletXPubYPubZPub401Response = void 0;
var SyncHDWalletXPubYPubZPub401Response = (function () {
    function SyncHDWalletXPubYPubZPub401Response() {
    }
    SyncHDWalletXPubYPubZPub401Response.getAttributeTypeMap = function () {
        return SyncHDWalletXPubYPubZPub401Response.attributeTypeMap;
    };
    SyncHDWalletXPubYPubZPub401Response.discriminator = undefined;
    SyncHDWalletXPubYPubZPub401Response.attributeTypeMap = [
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
            "type": "SyncHDWalletXPubYPubZPubE401"
        }
    ];
    return SyncHDWalletXPubYPubZPub401Response;
}());
exports.SyncHDWalletXPubYPubZPub401Response = SyncHDWalletXPubYPubZPub401Response;
//# sourceMappingURL=syncHDWalletXPubYPubZPub401Response.js.map