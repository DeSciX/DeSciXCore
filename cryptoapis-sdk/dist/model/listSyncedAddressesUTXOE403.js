"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListSyncedAddressesUTXOE403 = void 0;
var ListSyncedAddressesUTXOE403 = (function () {
    function ListSyncedAddressesUTXOE403() {
    }
    ListSyncedAddressesUTXOE403.getAttributeTypeMap = function () {
        return ListSyncedAddressesUTXOE403.attributeTypeMap;
    };
    ListSyncedAddressesUTXOE403.discriminator = undefined;
    ListSyncedAddressesUTXOE403.attributeTypeMap = [
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
    return ListSyncedAddressesUTXOE403;
}());
exports.ListSyncedAddressesUTXOE403 = ListSyncedAddressesUTXOE403;
//# sourceMappingURL=listSyncedAddressesUTXOE403.js.map