"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListSyncedAddressesE401 = void 0;
var ListSyncedAddressesE401 = (function () {
    function ListSyncedAddressesE401() {
    }
    ListSyncedAddressesE401.getAttributeTypeMap = function () {
        return ListSyncedAddressesE401.attributeTypeMap;
    };
    ListSyncedAddressesE401.discriminator = undefined;
    ListSyncedAddressesE401.attributeTypeMap = [
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
    return ListSyncedAddressesE401;
}());
exports.ListSyncedAddressesE401 = ListSyncedAddressesE401;
//# sourceMappingURL=listSyncedAddressesE401.js.map