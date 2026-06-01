"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteSyncedAddress400Response = void 0;
var DeleteSyncedAddress400Response = (function () {
    function DeleteSyncedAddress400Response() {
    }
    DeleteSyncedAddress400Response.getAttributeTypeMap = function () {
        return DeleteSyncedAddress400Response.attributeTypeMap;
    };
    DeleteSyncedAddress400Response.discriminator = undefined;
    DeleteSyncedAddress400Response.attributeTypeMap = [
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
            "name": "error",
            "baseName": "error",
            "type": "DeleteSyncedAddressE400"
        }
    ];
    return DeleteSyncedAddress400Response;
}());
exports.DeleteSyncedAddress400Response = DeleteSyncedAddress400Response;
//# sourceMappingURL=deleteSyncedAddress400Response.js.map