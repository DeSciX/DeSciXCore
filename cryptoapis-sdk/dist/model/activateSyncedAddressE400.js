"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivateSyncedAddressE400 = void 0;
var ActivateSyncedAddressE400 = (function () {
    function ActivateSyncedAddressE400() {
    }
    ActivateSyncedAddressE400.getAttributeTypeMap = function () {
        return ActivateSyncedAddressE400.attributeTypeMap;
    };
    ActivateSyncedAddressE400.discriminator = undefined;
    ActivateSyncedAddressE400.attributeTypeMap = [
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
    return ActivateSyncedAddressE400;
}());
exports.ActivateSyncedAddressE400 = ActivateSyncedAddressE400;
//# sourceMappingURL=activateSyncedAddressE400.js.map