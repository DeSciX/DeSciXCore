"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeriveAndSyncNewReceivingAddressesUTXO401Response = void 0;
var DeriveAndSyncNewReceivingAddressesUTXO401Response = (function () {
    function DeriveAndSyncNewReceivingAddressesUTXO401Response() {
    }
    DeriveAndSyncNewReceivingAddressesUTXO401Response.getAttributeTypeMap = function () {
        return DeriveAndSyncNewReceivingAddressesUTXO401Response.attributeTypeMap;
    };
    DeriveAndSyncNewReceivingAddressesUTXO401Response.discriminator = undefined;
    DeriveAndSyncNewReceivingAddressesUTXO401Response.attributeTypeMap = [
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
            "type": "DeriveAndSyncNewReceivingAddressesUTXOE401"
        }
    ];
    return DeriveAndSyncNewReceivingAddressesUTXO401Response;
}());
exports.DeriveAndSyncNewReceivingAddressesUTXO401Response = DeriveAndSyncNewReceivingAddressesUTXO401Response;
//# sourceMappingURL=deriveAndSyncNewReceivingAddressesUTXO401Response.js.map