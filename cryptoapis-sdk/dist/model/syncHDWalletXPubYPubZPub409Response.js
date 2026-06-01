"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncHDWalletXPubYPubZPub409Response = void 0;
var SyncHDWalletXPubYPubZPub409Response = (function () {
    function SyncHDWalletXPubYPubZPub409Response() {
    }
    SyncHDWalletXPubYPubZPub409Response.getAttributeTypeMap = function () {
        return SyncHDWalletXPubYPubZPub409Response.attributeTypeMap;
    };
    SyncHDWalletXPubYPubZPub409Response.discriminator = undefined;
    SyncHDWalletXPubYPubZPub409Response.attributeTypeMap = [
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
            "type": "SyncHDWalletXPubYPubZPubE409"
        }
    ];
    return SyncHDWalletXPubYPubZPub409Response;
}());
exports.SyncHDWalletXPubYPubZPub409Response = SyncHDWalletXPubYPubZPub409Response;
//# sourceMappingURL=syncHDWalletXPubYPubZPub409Response.js.map