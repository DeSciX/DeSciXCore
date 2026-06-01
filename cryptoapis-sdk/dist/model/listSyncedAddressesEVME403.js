"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListSyncedAddressesEVME403 = void 0;
var ListSyncedAddressesEVME403 = (function () {
    function ListSyncedAddressesEVME403() {
    }
    ListSyncedAddressesEVME403.getAttributeTypeMap = function () {
        return ListSyncedAddressesEVME403.attributeTypeMap;
    };
    ListSyncedAddressesEVME403.discriminator = undefined;
    ListSyncedAddressesEVME403.attributeTypeMap = [
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
    return ListSyncedAddressesEVME403;
}());
exports.ListSyncedAddressesEVME403 = ListSyncedAddressesEVME403;
//# sourceMappingURL=listSyncedAddressesEVME403.js.map