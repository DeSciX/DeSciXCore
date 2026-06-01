"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeriveAndSyncNewReceivingAddressesEVM400Response = void 0;
var DeriveAndSyncNewReceivingAddressesEVM400Response = (function () {
    function DeriveAndSyncNewReceivingAddressesEVM400Response() {
    }
    DeriveAndSyncNewReceivingAddressesEVM400Response.getAttributeTypeMap = function () {
        return DeriveAndSyncNewReceivingAddressesEVM400Response.attributeTypeMap;
    };
    DeriveAndSyncNewReceivingAddressesEVM400Response.discriminator = undefined;
    DeriveAndSyncNewReceivingAddressesEVM400Response.attributeTypeMap = [
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
            "type": "DeriveAndSyncNewReceivingAddressesEVME400"
        }
    ];
    return DeriveAndSyncNewReceivingAddressesEVM400Response;
}());
exports.DeriveAndSyncNewReceivingAddressesEVM400Response = DeriveAndSyncNewReceivingAddressesEVM400Response;
//# sourceMappingURL=deriveAndSyncNewReceivingAddressesEVM400Response.js.map