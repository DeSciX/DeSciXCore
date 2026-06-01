"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeriveAndSyncNewReceivingAddressesXRPR = void 0;
var DeriveAndSyncNewReceivingAddressesXRPR = (function () {
    function DeriveAndSyncNewReceivingAddressesXRPR() {
    }
    DeriveAndSyncNewReceivingAddressesXRPR.getAttributeTypeMap = function () {
        return DeriveAndSyncNewReceivingAddressesXRPR.attributeTypeMap;
    };
    DeriveAndSyncNewReceivingAddressesXRPR.discriminator = undefined;
    DeriveAndSyncNewReceivingAddressesXRPR.attributeTypeMap = [
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
            "type": "DeriveAndSyncNewReceivingAddressesXRPRData"
        }
    ];
    return DeriveAndSyncNewReceivingAddressesXRPR;
}());
exports.DeriveAndSyncNewReceivingAddressesXRPR = DeriveAndSyncNewReceivingAddressesXRPR;
//# sourceMappingURL=deriveAndSyncNewReceivingAddressesXRPR.js.map