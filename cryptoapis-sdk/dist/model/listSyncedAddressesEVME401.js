"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListSyncedAddressesEVME401 = void 0;
var ListSyncedAddressesEVME401 = (function () {
    function ListSyncedAddressesEVME401() {
    }
    ListSyncedAddressesEVME401.getAttributeTypeMap = function () {
        return ListSyncedAddressesEVME401.attributeTypeMap;
    };
    ListSyncedAddressesEVME401.discriminator = undefined;
    ListSyncedAddressesEVME401.attributeTypeMap = [
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
    return ListSyncedAddressesEVME401;
}());
exports.ListSyncedAddressesEVME401 = ListSyncedAddressesEVME401;
//# sourceMappingURL=listSyncedAddressesEVME401.js.map