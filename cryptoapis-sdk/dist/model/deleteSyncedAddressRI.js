"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteSyncedAddressRI = void 0;
var DeleteSyncedAddressRI = (function () {
    function DeleteSyncedAddressRI() {
    }
    DeleteSyncedAddressRI.getAttributeTypeMap = function () {
        return DeleteSyncedAddressRI.attributeTypeMap;
    };
    DeleteSyncedAddressRI.discriminator = undefined;
    DeleteSyncedAddressRI.attributeTypeMap = [
        {
            "name": "isActive",
            "baseName": "isActive",
            "type": "boolean"
        },
        {
            "name": "syncStatus",
            "baseName": "syncStatus",
            "type": "string"
        }
    ];
    return DeleteSyncedAddressRI;
}());
exports.DeleteSyncedAddressRI = DeleteSyncedAddressRI;
//# sourceMappingURL=deleteSyncedAddressRI.js.map