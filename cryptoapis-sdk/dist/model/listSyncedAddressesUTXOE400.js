"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListSyncedAddressesUTXOE400 = void 0;
var ListSyncedAddressesUTXOE400 = (function () {
    function ListSyncedAddressesUTXOE400() {
    }
    ListSyncedAddressesUTXOE400.getAttributeTypeMap = function () {
        return ListSyncedAddressesUTXOE400.attributeTypeMap;
    };
    ListSyncedAddressesUTXOE400.discriminator = undefined;
    ListSyncedAddressesUTXOE400.attributeTypeMap = [
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
    return ListSyncedAddressesUTXOE400;
}());
exports.ListSyncedAddressesUTXOE400 = ListSyncedAddressesUTXOE400;
//# sourceMappingURL=listSyncedAddressesUTXOE400.js.map