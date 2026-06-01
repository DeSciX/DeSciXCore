"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeriveAndSyncNewReceivingAddressesEVM403Response = void 0;
var DeriveAndSyncNewReceivingAddressesEVM403Response = (function () {
    function DeriveAndSyncNewReceivingAddressesEVM403Response() {
    }
    DeriveAndSyncNewReceivingAddressesEVM403Response.getAttributeTypeMap = function () {
        return DeriveAndSyncNewReceivingAddressesEVM403Response.attributeTypeMap;
    };
    DeriveAndSyncNewReceivingAddressesEVM403Response.discriminator = undefined;
    DeriveAndSyncNewReceivingAddressesEVM403Response.attributeTypeMap = [
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
            "type": "DeriveAndSyncNewReceivingAddressesEVME403"
        }
    ];
    return DeriveAndSyncNewReceivingAddressesEVM403Response;
}());
exports.DeriveAndSyncNewReceivingAddressesEVM403Response = DeriveAndSyncNewReceivingAddressesEVM403Response;
//# sourceMappingURL=deriveAndSyncNewReceivingAddressesEVM403Response.js.map