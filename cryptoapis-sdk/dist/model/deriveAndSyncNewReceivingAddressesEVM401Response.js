"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeriveAndSyncNewReceivingAddressesEVM401Response = void 0;
var DeriveAndSyncNewReceivingAddressesEVM401Response = (function () {
    function DeriveAndSyncNewReceivingAddressesEVM401Response() {
    }
    DeriveAndSyncNewReceivingAddressesEVM401Response.getAttributeTypeMap = function () {
        return DeriveAndSyncNewReceivingAddressesEVM401Response.attributeTypeMap;
    };
    DeriveAndSyncNewReceivingAddressesEVM401Response.discriminator = undefined;
    DeriveAndSyncNewReceivingAddressesEVM401Response.attributeTypeMap = [
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
            "type": "DeriveAndSyncNewReceivingAddressesEVME401"
        }
    ];
    return DeriveAndSyncNewReceivingAddressesEVM401Response;
}());
exports.DeriveAndSyncNewReceivingAddressesEVM401Response = DeriveAndSyncNewReceivingAddressesEVM401Response;
//# sourceMappingURL=deriveAndSyncNewReceivingAddressesEVM401Response.js.map