"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteSyncedAddress403Response = void 0;
var DeleteSyncedAddress403Response = (function () {
    function DeleteSyncedAddress403Response() {
    }
    DeleteSyncedAddress403Response.getAttributeTypeMap = function () {
        return DeleteSyncedAddress403Response.attributeTypeMap;
    };
    DeleteSyncedAddress403Response.discriminator = undefined;
    DeleteSyncedAddress403Response.attributeTypeMap = [
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
            "type": "DeleteSyncedAddressE403"
        }
    ];
    return DeleteSyncedAddress403Response;
}());
exports.DeleteSyncedAddress403Response = DeleteSyncedAddress403Response;
//# sourceMappingURL=deleteSyncedAddress403Response.js.map