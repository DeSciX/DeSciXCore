"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListSyncedAddressesUTXOE401 = void 0;
var ListSyncedAddressesUTXOE401 = (function () {
    function ListSyncedAddressesUTXOE401() {
    }
    ListSyncedAddressesUTXOE401.getAttributeTypeMap = function () {
        return ListSyncedAddressesUTXOE401.attributeTypeMap;
    };
    ListSyncedAddressesUTXOE401.discriminator = undefined;
    ListSyncedAddressesUTXOE401.attributeTypeMap = [
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
    return ListSyncedAddressesUTXOE401;
}());
exports.ListSyncedAddressesUTXOE401 = ListSyncedAddressesUTXOE401;
//# sourceMappingURL=listSyncedAddressesUTXOE401.js.map