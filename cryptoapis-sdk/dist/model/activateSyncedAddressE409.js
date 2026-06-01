"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivateSyncedAddressE409 = void 0;
var ActivateSyncedAddressE409 = (function () {
    function ActivateSyncedAddressE409() {
    }
    ActivateSyncedAddressE409.getAttributeTypeMap = function () {
        return ActivateSyncedAddressE409.attributeTypeMap;
    };
    ActivateSyncedAddressE409.discriminator = undefined;
    ActivateSyncedAddressE409.attributeTypeMap = [
        {
            "name": "code",
            "baseName": "code",
            "type": "string"
        },
        {
            "name": "message",
            "baseName": "message",
            "type": "string"
        },
        {
            "name": "details",
            "baseName": "details",
            "type": "Array<BannedIpAddressDetailsInner>"
        }
    ];
    return ActivateSyncedAddressE409;
}());
exports.ActivateSyncedAddressE409 = ActivateSyncedAddressE409;
//# sourceMappingURL=activateSyncedAddressE409.js.map