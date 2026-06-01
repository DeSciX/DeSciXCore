"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListSyncedAddressesEVME400 = void 0;
var ListSyncedAddressesEVME400 = (function () {
    function ListSyncedAddressesEVME400() {
    }
    ListSyncedAddressesEVME400.getAttributeTypeMap = function () {
        return ListSyncedAddressesEVME400.attributeTypeMap;
    };
    ListSyncedAddressesEVME400.discriminator = undefined;
    ListSyncedAddressesEVME400.attributeTypeMap = [
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
    return ListSyncedAddressesEVME400;
}());
exports.ListSyncedAddressesEVME400 = ListSyncedAddressesEVME400;
//# sourceMappingURL=listSyncedAddressesEVME400.js.map