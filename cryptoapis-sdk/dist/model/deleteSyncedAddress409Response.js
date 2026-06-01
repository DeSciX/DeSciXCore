"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteSyncedAddress409Response = void 0;
var DeleteSyncedAddress409Response = (function () {
    function DeleteSyncedAddress409Response() {
    }
    DeleteSyncedAddress409Response.getAttributeTypeMap = function () {
        return DeleteSyncedAddress409Response.attributeTypeMap;
    };
    DeleteSyncedAddress409Response.discriminator = undefined;
    DeleteSyncedAddress409Response.attributeTypeMap = [
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
            "type": "DeleteSyncedAddressE409"
        }
    ];
    return DeleteSyncedAddress409Response;
}());
exports.DeleteSyncedAddress409Response = DeleteSyncedAddress409Response;
//# sourceMappingURL=deleteSyncedAddress409Response.js.map