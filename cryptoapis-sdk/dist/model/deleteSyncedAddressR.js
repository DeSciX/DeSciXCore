"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteSyncedAddressR = void 0;
var DeleteSyncedAddressR = (function () {
    function DeleteSyncedAddressR() {
    }
    DeleteSyncedAddressR.getAttributeTypeMap = function () {
        return DeleteSyncedAddressR.attributeTypeMap;
    };
    DeleteSyncedAddressR.discriminator = undefined;
    DeleteSyncedAddressR.attributeTypeMap = [
        {
            "name": "apiVersion",
            "baseName": "apiVersion",
            "type": "string"
        },
        {
            "name": "requestId",
            "baseName": "requestId",
            "type": "string"
        },
        {
            "name": "context",
            "baseName": "context",
            "type": "string"
        },
        {
            "name": "data",
            "baseName": "data",
            "type": "DeleteSyncedAddressRData"
        }
    ];
    return DeleteSyncedAddressR;
}());
exports.DeleteSyncedAddressR = DeleteSyncedAddressR;
//# sourceMappingURL=deleteSyncedAddressR.js.map