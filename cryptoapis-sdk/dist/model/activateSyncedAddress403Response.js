"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivateSyncedAddress403Response = void 0;
var ActivateSyncedAddress403Response = (function () {
    function ActivateSyncedAddress403Response() {
    }
    ActivateSyncedAddress403Response.getAttributeTypeMap = function () {
        return ActivateSyncedAddress403Response.attributeTypeMap;
    };
    ActivateSyncedAddress403Response.discriminator = undefined;
    ActivateSyncedAddress403Response.attributeTypeMap = [
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
            "type": "ActivateSyncedAddressE403"
        }
    ];
    return ActivateSyncedAddress403Response;
}());
exports.ActivateSyncedAddress403Response = ActivateSyncedAddress403Response;
//# sourceMappingURL=activateSyncedAddress403Response.js.map