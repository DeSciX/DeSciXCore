"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListSyncedAddressesXRPE401 = void 0;
var ListSyncedAddressesXRPE401 = (function () {
    function ListSyncedAddressesXRPE401() {
    }
    ListSyncedAddressesXRPE401.getAttributeTypeMap = function () {
        return ListSyncedAddressesXRPE401.attributeTypeMap;
    };
    ListSyncedAddressesXRPE401.discriminator = undefined;
    ListSyncedAddressesXRPE401.attributeTypeMap = [
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
    return ListSyncedAddressesXRPE401;
}());
exports.ListSyncedAddressesXRPE401 = ListSyncedAddressesXRPE401;
//# sourceMappingURL=listSyncedAddressesXRPE401.js.map