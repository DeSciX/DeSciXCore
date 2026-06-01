"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteSyncedAddressE403 = void 0;
var DeleteSyncedAddressE403 = (function () {
    function DeleteSyncedAddressE403() {
    }
    DeleteSyncedAddressE403.getAttributeTypeMap = function () {
        return DeleteSyncedAddressE403.attributeTypeMap;
    };
    DeleteSyncedAddressE403.discriminator = undefined;
    DeleteSyncedAddressE403.attributeTypeMap = [
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
    return DeleteSyncedAddressE403;
}());
exports.DeleteSyncedAddressE403 = DeleteSyncedAddressE403;
//# sourceMappingURL=deleteSyncedAddressE403.js.map