"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListSyncedAddressesXRPE400 = void 0;
var ListSyncedAddressesXRPE400 = (function () {
    function ListSyncedAddressesXRPE400() {
    }
    ListSyncedAddressesXRPE400.getAttributeTypeMap = function () {
        return ListSyncedAddressesXRPE400.attributeTypeMap;
    };
    ListSyncedAddressesXRPE400.discriminator = undefined;
    ListSyncedAddressesXRPE400.attributeTypeMap = [
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
    return ListSyncedAddressesXRPE400;
}());
exports.ListSyncedAddressesXRPE400 = ListSyncedAddressesXRPE400;
//# sourceMappingURL=listSyncedAddressesXRPE400.js.map