"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivateSyncedAddress409Response = void 0;
var ActivateSyncedAddress409Response = (function () {
    function ActivateSyncedAddress409Response() {
    }
    ActivateSyncedAddress409Response.getAttributeTypeMap = function () {
        return ActivateSyncedAddress409Response.attributeTypeMap;
    };
    ActivateSyncedAddress409Response.discriminator = undefined;
    ActivateSyncedAddress409Response.attributeTypeMap = [
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
            "type": "ActivateSyncedAddressE409"
        }
    ];
    return ActivateSyncedAddress409Response;
}());
exports.ActivateSyncedAddress409Response = ActivateSyncedAddress409Response;
//# sourceMappingURL=activateSyncedAddress409Response.js.map