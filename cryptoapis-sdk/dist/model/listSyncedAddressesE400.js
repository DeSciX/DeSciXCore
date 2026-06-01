"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListSyncedAddressesE400 = void 0;
var ListSyncedAddressesE400 = (function () {
    function ListSyncedAddressesE400() {
    }
    ListSyncedAddressesE400.getAttributeTypeMap = function () {
        return ListSyncedAddressesE400.attributeTypeMap;
    };
    ListSyncedAddressesE400.discriminator = undefined;
    ListSyncedAddressesE400.attributeTypeMap = [
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
    return ListSyncedAddressesE400;
}());
exports.ListSyncedAddressesE400 = ListSyncedAddressesE400;
//# sourceMappingURL=listSyncedAddressesE400.js.map