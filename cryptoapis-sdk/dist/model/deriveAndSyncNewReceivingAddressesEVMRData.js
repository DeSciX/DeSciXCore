"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeriveAndSyncNewReceivingAddressesEVMRData = void 0;
var DeriveAndSyncNewReceivingAddressesEVMRData = (function () {
    function DeriveAndSyncNewReceivingAddressesEVMRData() {
    }
    DeriveAndSyncNewReceivingAddressesEVMRData.getAttributeTypeMap = function () {
        return DeriveAndSyncNewReceivingAddressesEVMRData.attributeTypeMap;
    };
    DeriveAndSyncNewReceivingAddressesEVMRData.discriminator = undefined;
    DeriveAndSyncNewReceivingAddressesEVMRData.attributeTypeMap = [
        {
            "name": "limit",
            "baseName": "limit",
            "type": "number"
        },
        {
            "name": "offset",
            "baseName": "offset",
            "type": "number"
        },
        {
            "name": "total",
            "baseName": "total",
            "type": "number"
        },
        {
            "name": "items",
            "baseName": "items",
            "type": "Array<DeriveAndSyncNewReceivingAddressesEVMRI>"
        }
    ];
    return DeriveAndSyncNewReceivingAddressesEVMRData;
}());
exports.DeriveAndSyncNewReceivingAddressesEVMRData = DeriveAndSyncNewReceivingAddressesEVMRData;
//# sourceMappingURL=deriveAndSyncNewReceivingAddressesEVMRData.js.map