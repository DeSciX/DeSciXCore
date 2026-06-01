"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListSyncedAddressesE403 = void 0;
var ListSyncedAddressesE403 = (function () {
    function ListSyncedAddressesE403() {
    }
    ListSyncedAddressesE403.getAttributeTypeMap = function () {
        return ListSyncedAddressesE403.attributeTypeMap;
    };
    ListSyncedAddressesE403.discriminator = undefined;
    ListSyncedAddressesE403.attributeTypeMap = [
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
    return ListSyncedAddressesE403;
}());
exports.ListSyncedAddressesE403 = ListSyncedAddressesE403;
//# sourceMappingURL=listSyncedAddressesE403.js.map