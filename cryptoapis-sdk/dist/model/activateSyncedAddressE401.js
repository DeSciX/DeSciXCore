"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivateSyncedAddressE401 = void 0;
var ActivateSyncedAddressE401 = (function () {
    function ActivateSyncedAddressE401() {
    }
    ActivateSyncedAddressE401.getAttributeTypeMap = function () {
        return ActivateSyncedAddressE401.attributeTypeMap;
    };
    ActivateSyncedAddressE401.discriminator = undefined;
    ActivateSyncedAddressE401.attributeTypeMap = [
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
    return ActivateSyncedAddressE401;
}());
exports.ActivateSyncedAddressE401 = ActivateSyncedAddressE401;
//# sourceMappingURL=activateSyncedAddressE401.js.map