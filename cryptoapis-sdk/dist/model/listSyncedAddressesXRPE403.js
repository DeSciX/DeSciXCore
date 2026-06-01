"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListSyncedAddressesXRPE403 = void 0;
var ListSyncedAddressesXRPE403 = (function () {
    function ListSyncedAddressesXRPE403() {
    }
    ListSyncedAddressesXRPE403.getAttributeTypeMap = function () {
        return ListSyncedAddressesXRPE403.attributeTypeMap;
    };
    ListSyncedAddressesXRPE403.discriminator = undefined;
    ListSyncedAddressesXRPE403.attributeTypeMap = [
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
    return ListSyncedAddressesXRPE403;
}());
exports.ListSyncedAddressesXRPE403 = ListSyncedAddressesXRPE403;
//# sourceMappingURL=listSyncedAddressesXRPE403.js.map