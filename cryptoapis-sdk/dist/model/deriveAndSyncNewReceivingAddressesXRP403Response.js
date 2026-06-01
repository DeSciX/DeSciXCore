"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeriveAndSyncNewReceivingAddressesXRP403Response = void 0;
var DeriveAndSyncNewReceivingAddressesXRP403Response = (function () {
    function DeriveAndSyncNewReceivingAddressesXRP403Response() {
    }
    DeriveAndSyncNewReceivingAddressesXRP403Response.getAttributeTypeMap = function () {
        return DeriveAndSyncNewReceivingAddressesXRP403Response.attributeTypeMap;
    };
    DeriveAndSyncNewReceivingAddressesXRP403Response.discriminator = undefined;
    DeriveAndSyncNewReceivingAddressesXRP403Response.attributeTypeMap = [
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
            "type": "DeriveAndSyncNewReceivingAddressesXRPE403"
        }
    ];
    return DeriveAndSyncNewReceivingAddressesXRP403Response;
}());
exports.DeriveAndSyncNewReceivingAddressesXRP403Response = DeriveAndSyncNewReceivingAddressesXRP403Response;
//# sourceMappingURL=deriveAndSyncNewReceivingAddressesXRP403Response.js.map