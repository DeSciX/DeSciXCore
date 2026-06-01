"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeriveAndSyncNewReceivingAddressesXRP400Response = void 0;
var DeriveAndSyncNewReceivingAddressesXRP400Response = (function () {
    function DeriveAndSyncNewReceivingAddressesXRP400Response() {
    }
    DeriveAndSyncNewReceivingAddressesXRP400Response.getAttributeTypeMap = function () {
        return DeriveAndSyncNewReceivingAddressesXRP400Response.attributeTypeMap;
    };
    DeriveAndSyncNewReceivingAddressesXRP400Response.discriminator = undefined;
    DeriveAndSyncNewReceivingAddressesXRP400Response.attributeTypeMap = [
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
            "type": "DeriveAndSyncNewReceivingAddressesXRPE400"
        }
    ];
    return DeriveAndSyncNewReceivingAddressesXRP400Response;
}());
exports.DeriveAndSyncNewReceivingAddressesXRP400Response = DeriveAndSyncNewReceivingAddressesXRP400Response;
//# sourceMappingURL=deriveAndSyncNewReceivingAddressesXRP400Response.js.map