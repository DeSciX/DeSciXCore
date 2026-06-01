"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivateSyncedAddressE403 = void 0;
var ActivateSyncedAddressE403 = (function () {
    function ActivateSyncedAddressE403() {
    }
    ActivateSyncedAddressE403.getAttributeTypeMap = function () {
        return ActivateSyncedAddressE403.attributeTypeMap;
    };
    ActivateSyncedAddressE403.discriminator = undefined;
    ActivateSyncedAddressE403.attributeTypeMap = [
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
    return ActivateSyncedAddressE403;
}());
exports.ActivateSyncedAddressE403 = ActivateSyncedAddressE403;
//# sourceMappingURL=activateSyncedAddressE403.js.map