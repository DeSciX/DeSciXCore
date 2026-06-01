"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeriveAndSyncNewReceivingAddressesXRPRData = void 0;
var DeriveAndSyncNewReceivingAddressesXRPRData = (function () {
    function DeriveAndSyncNewReceivingAddressesXRPRData() {
    }
    DeriveAndSyncNewReceivingAddressesXRPRData.getAttributeTypeMap = function () {
        return DeriveAndSyncNewReceivingAddressesXRPRData.attributeTypeMap;
    };
    DeriveAndSyncNewReceivingAddressesXRPRData.discriminator = undefined;
    DeriveAndSyncNewReceivingAddressesXRPRData.attributeTypeMap = [
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
            "type": "Array<DeriveAndSyncNewReceivingAddressesXRPRI>"
        }
    ];
    return DeriveAndSyncNewReceivingAddressesXRPRData;
}());
exports.DeriveAndSyncNewReceivingAddressesXRPRData = DeriveAndSyncNewReceivingAddressesXRPRData;
//# sourceMappingURL=deriveAndSyncNewReceivingAddressesXRPRData.js.map