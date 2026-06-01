"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteSyncedAddress401Response = void 0;
var DeleteSyncedAddress401Response = (function () {
    function DeleteSyncedAddress401Response() {
    }
    DeleteSyncedAddress401Response.getAttributeTypeMap = function () {
        return DeleteSyncedAddress401Response.attributeTypeMap;
    };
    DeleteSyncedAddress401Response.discriminator = undefined;
    DeleteSyncedAddress401Response.attributeTypeMap = [
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
            "type": "DeleteSyncedAddressE401"
        }
    ];
    return DeleteSyncedAddress401Response;
}());
exports.DeleteSyncedAddress401Response = DeleteSyncedAddress401Response;
//# sourceMappingURL=deleteSyncedAddress401Response.js.map