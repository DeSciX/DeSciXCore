"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeriveHDWalletXPubYPubZPubChangeOrReceivingAddresses401Response = void 0;
var DeriveHDWalletXPubYPubZPubChangeOrReceivingAddresses401Response = (function () {
    function DeriveHDWalletXPubYPubZPubChangeOrReceivingAddresses401Response() {
    }
    DeriveHDWalletXPubYPubZPubChangeOrReceivingAddresses401Response.getAttributeTypeMap = function () {
        return DeriveHDWalletXPubYPubZPubChangeOrReceivingAddresses401Response.attributeTypeMap;
    };
    DeriveHDWalletXPubYPubZPubChangeOrReceivingAddresses401Response.discriminator = undefined;
    DeriveHDWalletXPubYPubZPubChangeOrReceivingAddresses401Response.attributeTypeMap = [
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
            "type": "DeriveHDWalletXPubYPubZPubChangeOrReceivingAddressesE401"
        }
    ];
    return DeriveHDWalletXPubYPubZPubChangeOrReceivingAddresses401Response;
}());
exports.DeriveHDWalletXPubYPubZPubChangeOrReceivingAddresses401Response = DeriveHDWalletXPubYPubZPubChangeOrReceivingAddresses401Response;
//# sourceMappingURL=deriveHDWalletXPubYPubZPubChangeOrReceivingAddresses401Response.js.map