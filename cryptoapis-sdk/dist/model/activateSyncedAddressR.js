"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivateSyncedAddressR = void 0;
var ActivateSyncedAddressR = (function () {
    function ActivateSyncedAddressR() {
    }
    ActivateSyncedAddressR.getAttributeTypeMap = function () {
        return ActivateSyncedAddressR.attributeTypeMap;
    };
    ActivateSyncedAddressR.discriminator = undefined;
    ActivateSyncedAddressR.attributeTypeMap = [
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
            "type": "ActivateSyncedAddressRData"
        }
    ];
    return ActivateSyncedAddressR;
}());
exports.ActivateSyncedAddressR = ActivateSyncedAddressR;
//# sourceMappingURL=activateSyncedAddressR.js.map