"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeriveAndSyncNewReceivingAddressesEVMR = void 0;
var DeriveAndSyncNewReceivingAddressesEVMR = (function () {
    function DeriveAndSyncNewReceivingAddressesEVMR() {
    }
    DeriveAndSyncNewReceivingAddressesEVMR.getAttributeTypeMap = function () {
        return DeriveAndSyncNewReceivingAddressesEVMR.attributeTypeMap;
    };
    DeriveAndSyncNewReceivingAddressesEVMR.discriminator = undefined;
    DeriveAndSyncNewReceivingAddressesEVMR.attributeTypeMap = [
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
            "type": "DeriveAndSyncNewReceivingAddressesEVMRData"
        }
    ];
    return DeriveAndSyncNewReceivingAddressesEVMR;
}());
exports.DeriveAndSyncNewReceivingAddressesEVMR = DeriveAndSyncNewReceivingAddressesEVMR;
//# sourceMappingURL=deriveAndSyncNewReceivingAddressesEVMR.js.map