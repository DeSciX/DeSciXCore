"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeriveAndSyncNewReceivingAddressesUTXOR = void 0;
var DeriveAndSyncNewReceivingAddressesUTXOR = (function () {
    function DeriveAndSyncNewReceivingAddressesUTXOR() {
    }
    DeriveAndSyncNewReceivingAddressesUTXOR.getAttributeTypeMap = function () {
        return DeriveAndSyncNewReceivingAddressesUTXOR.attributeTypeMap;
    };
    DeriveAndSyncNewReceivingAddressesUTXOR.discriminator = undefined;
    DeriveAndSyncNewReceivingAddressesUTXOR.attributeTypeMap = [
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
            "name": "data",
            "baseName": "data",
            "type": "DeriveAndSyncNewReceivingAddressesUTXORData"
        }
    ];
    return DeriveAndSyncNewReceivingAddressesUTXOR;
}());
exports.DeriveAndSyncNewReceivingAddressesUTXOR = DeriveAndSyncNewReceivingAddressesUTXOR;
//# sourceMappingURL=deriveAndSyncNewReceivingAddressesUTXOR.js.map