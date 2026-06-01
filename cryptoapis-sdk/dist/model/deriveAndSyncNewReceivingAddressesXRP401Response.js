"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeriveAndSyncNewReceivingAddressesXRP401Response = void 0;
var DeriveAndSyncNewReceivingAddressesXRP401Response = (function () {
    function DeriveAndSyncNewReceivingAddressesXRP401Response() {
    }
    DeriveAndSyncNewReceivingAddressesXRP401Response.getAttributeTypeMap = function () {
        return DeriveAndSyncNewReceivingAddressesXRP401Response.attributeTypeMap;
    };
    DeriveAndSyncNewReceivingAddressesXRP401Response.discriminator = undefined;
    DeriveAndSyncNewReceivingAddressesXRP401Response.attributeTypeMap = [
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
            "type": "DeriveAndSyncNewReceivingAddressesXRPE401"
        }
    ];
    return DeriveAndSyncNewReceivingAddressesXRP401Response;
}());
exports.DeriveAndSyncNewReceivingAddressesXRP401Response = DeriveAndSyncNewReceivingAddressesXRP401Response;
//# sourceMappingURL=deriveAndSyncNewReceivingAddressesXRP401Response.js.map