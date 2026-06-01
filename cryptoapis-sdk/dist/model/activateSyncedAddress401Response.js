"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivateSyncedAddress401Response = void 0;
var ActivateSyncedAddress401Response = (function () {
    function ActivateSyncedAddress401Response() {
    }
    ActivateSyncedAddress401Response.getAttributeTypeMap = function () {
        return ActivateSyncedAddress401Response.attributeTypeMap;
    };
    ActivateSyncedAddress401Response.discriminator = undefined;
    ActivateSyncedAddress401Response.attributeTypeMap = [
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
            "type": "ActivateSyncedAddressE401"
        }
    ];
    return ActivateSyncedAddress401Response;
}());
exports.ActivateSyncedAddress401Response = ActivateSyncedAddress401Response;
//# sourceMappingURL=activateSyncedAddress401Response.js.map