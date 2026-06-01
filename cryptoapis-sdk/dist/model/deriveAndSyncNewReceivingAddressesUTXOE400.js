"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeriveAndSyncNewReceivingAddressesUTXOE400 = void 0;
var DeriveAndSyncNewReceivingAddressesUTXOE400 = (function () {
    function DeriveAndSyncNewReceivingAddressesUTXOE400() {
    }
    DeriveAndSyncNewReceivingAddressesUTXOE400.getAttributeTypeMap = function () {
        return DeriveAndSyncNewReceivingAddressesUTXOE400.attributeTypeMap;
    };
    DeriveAndSyncNewReceivingAddressesUTXOE400.discriminator = undefined;
    DeriveAndSyncNewReceivingAddressesUTXOE400.attributeTypeMap = [
        {
            "name": "code",
            "baseName": "code",
            "type": "string"
        },
        {
            "name": "message",
            "baseName": "message",
            "type": "string"
        },
        {
            "name": "details",
            "baseName": "details",
            "type": "Array<BannedIpAddressDetailsInner>"
        }
    ];
    return DeriveAndSyncNewReceivingAddressesUTXOE400;
}());
exports.DeriveAndSyncNewReceivingAddressesUTXOE400 = DeriveAndSyncNewReceivingAddressesUTXOE400;
//# sourceMappingURL=deriveAndSyncNewReceivingAddressesUTXOE400.js.map