"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivateHDWalletXPubYPubZPub400Response = void 0;
var ActivateHDWalletXPubYPubZPub400Response = (function () {
    function ActivateHDWalletXPubYPubZPub400Response() {
    }
    ActivateHDWalletXPubYPubZPub400Response.getAttributeTypeMap = function () {
        return ActivateHDWalletXPubYPubZPub400Response.attributeTypeMap;
    };
    ActivateHDWalletXPubYPubZPub400Response.discriminator = undefined;
    ActivateHDWalletXPubYPubZPub400Response.attributeTypeMap = [
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
            "type": "ActivateHDWalletXPubYPubZPubE400"
        }
    ];
    return ActivateHDWalletXPubYPubZPub400Response;
}());
exports.ActivateHDWalletXPubYPubZPub400Response = ActivateHDWalletXPubYPubZPub400Response;
//# sourceMappingURL=activateHDWalletXPubYPubZPub400Response.js.map