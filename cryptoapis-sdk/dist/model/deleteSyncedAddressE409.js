"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteSyncedAddressE409 = void 0;
var DeleteSyncedAddressE409 = (function () {
    function DeleteSyncedAddressE409() {
    }
    DeleteSyncedAddressE409.getAttributeTypeMap = function () {
        return DeleteSyncedAddressE409.attributeTypeMap;
    };
    DeleteSyncedAddressE409.discriminator = undefined;
    DeleteSyncedAddressE409.attributeTypeMap = [
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
    return DeleteSyncedAddressE409;
}());
exports.DeleteSyncedAddressE409 = DeleteSyncedAddressE409;
//# sourceMappingURL=deleteSyncedAddressE409.js.map