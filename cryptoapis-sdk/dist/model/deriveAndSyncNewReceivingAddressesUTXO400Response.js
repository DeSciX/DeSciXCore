"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeriveAndSyncNewReceivingAddressesUTXO400Response = void 0;
var DeriveAndSyncNewReceivingAddressesUTXO400Response = (function () {
    function DeriveAndSyncNewReceivingAddressesUTXO400Response() {
    }
    DeriveAndSyncNewReceivingAddressesUTXO400Response.getAttributeTypeMap = function () {
        return DeriveAndSyncNewReceivingAddressesUTXO400Response.attributeTypeMap;
    };
    DeriveAndSyncNewReceivingAddressesUTXO400Response.discriminator = undefined;
    DeriveAndSyncNewReceivingAddressesUTXO400Response.attributeTypeMap = [
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
            "type": "DeriveAndSyncNewReceivingAddressesUTXOE400"
        }
    ];
    return DeriveAndSyncNewReceivingAddressesUTXO400Response;
}());
exports.DeriveAndSyncNewReceivingAddressesUTXO400Response = DeriveAndSyncNewReceivingAddressesUTXO400Response;
//# sourceMappingURL=deriveAndSyncNewReceivingAddressesUTXO400Response.js.map