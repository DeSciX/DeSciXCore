"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeriveAndSyncNewReceivingAddressesUTXO403Response = void 0;
var DeriveAndSyncNewReceivingAddressesUTXO403Response = (function () {
    function DeriveAndSyncNewReceivingAddressesUTXO403Response() {
    }
    DeriveAndSyncNewReceivingAddressesUTXO403Response.getAttributeTypeMap = function () {
        return DeriveAndSyncNewReceivingAddressesUTXO403Response.attributeTypeMap;
    };
    DeriveAndSyncNewReceivingAddressesUTXO403Response.discriminator = undefined;
    DeriveAndSyncNewReceivingAddressesUTXO403Response.attributeTypeMap = [
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
            "type": "DeriveAndSyncNewReceivingAddressesUTXOE403"
        }
    ];
    return DeriveAndSyncNewReceivingAddressesUTXO403Response;
}());
exports.DeriveAndSyncNewReceivingAddressesUTXO403Response = DeriveAndSyncNewReceivingAddressesUTXO403Response;
//# sourceMappingURL=deriveAndSyncNewReceivingAddressesUTXO403Response.js.map