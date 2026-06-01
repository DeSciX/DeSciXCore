"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteSyncedAddressE401 = void 0;
var DeleteSyncedAddressE401 = (function () {
    function DeleteSyncedAddressE401() {
    }
    DeleteSyncedAddressE401.getAttributeTypeMap = function () {
        return DeleteSyncedAddressE401.attributeTypeMap;
    };
    DeleteSyncedAddressE401.discriminator = undefined;
    DeleteSyncedAddressE401.attributeTypeMap = [
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
    return DeleteSyncedAddressE401;
}());
exports.DeleteSyncedAddressE401 = DeleteSyncedAddressE401;
//# sourceMappingURL=deleteSyncedAddressE401.js.map