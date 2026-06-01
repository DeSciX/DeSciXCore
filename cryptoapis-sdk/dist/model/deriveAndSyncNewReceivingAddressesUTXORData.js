"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeriveAndSyncNewReceivingAddressesUTXORData = void 0;
var DeriveAndSyncNewReceivingAddressesUTXORData = (function () {
    function DeriveAndSyncNewReceivingAddressesUTXORData() {
    }
    DeriveAndSyncNewReceivingAddressesUTXORData.getAttributeTypeMap = function () {
        return DeriveAndSyncNewReceivingAddressesUTXORData.attributeTypeMap;
    };
    DeriveAndSyncNewReceivingAddressesUTXORData.discriminator = undefined;
    DeriveAndSyncNewReceivingAddressesUTXORData.attributeTypeMap = [
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
            "type": "Array<DeriveAndSyncNewReceivingAddressesUTXORI>"
        }
    ];
    return DeriveAndSyncNewReceivingAddressesUTXORData;
}());
exports.DeriveAndSyncNewReceivingAddressesUTXORData = DeriveAndSyncNewReceivingAddressesUTXORData;
//# sourceMappingURL=deriveAndSyncNewReceivingAddressesUTXORData.js.map