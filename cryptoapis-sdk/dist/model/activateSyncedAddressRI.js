"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivateSyncedAddressRI = void 0;
var ActivateSyncedAddressRI = (function () {
    function ActivateSyncedAddressRI() {
    }
    ActivateSyncedAddressRI.getAttributeTypeMap = function () {
        return ActivateSyncedAddressRI.attributeTypeMap;
    };
    ActivateSyncedAddressRI.discriminator = undefined;
    ActivateSyncedAddressRI.attributeTypeMap = [
        {
            "name": "isActive",
            "baseName": "isActive",
            "type": "boolean"
        },
        {
            "name": "syncStatus",
            "baseName": "syncStatus",
            "type": "string"
        }
    ];
    return ActivateSyncedAddressRI;
}());
exports.ActivateSyncedAddressRI = ActivateSyncedAddressRI;
//# sourceMappingURL=activateSyncedAddressRI.js.map