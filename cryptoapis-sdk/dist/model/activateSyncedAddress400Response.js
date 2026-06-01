"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivateSyncedAddress400Response = void 0;
var ActivateSyncedAddress400Response = (function () {
    function ActivateSyncedAddress400Response() {
    }
    ActivateSyncedAddress400Response.getAttributeTypeMap = function () {
        return ActivateSyncedAddress400Response.attributeTypeMap;
    };
    ActivateSyncedAddress400Response.discriminator = undefined;
    ActivateSyncedAddress400Response.attributeTypeMap = [
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
            "type": "ActivateSyncedAddressE400"
        }
    ];
    return ActivateSyncedAddress400Response;
}());
exports.ActivateSyncedAddress400Response = ActivateSyncedAddress400Response;
//# sourceMappingURL=activateSyncedAddress400Response.js.map