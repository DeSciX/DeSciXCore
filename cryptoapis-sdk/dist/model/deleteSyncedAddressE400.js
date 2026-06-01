"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteSyncedAddressE400 = void 0;
var DeleteSyncedAddressE400 = (function () {
    function DeleteSyncedAddressE400() {
    }
    DeleteSyncedAddressE400.getAttributeTypeMap = function () {
        return DeleteSyncedAddressE400.attributeTypeMap;
    };
    DeleteSyncedAddressE400.discriminator = undefined;
    DeleteSyncedAddressE400.attributeTypeMap = [
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
    return DeleteSyncedAddressE400;
}());
exports.DeleteSyncedAddressE400 = DeleteSyncedAddressE400;
//# sourceMappingURL=deleteSyncedAddressE400.js.map