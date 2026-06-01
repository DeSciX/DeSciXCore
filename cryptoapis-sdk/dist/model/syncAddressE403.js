"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncAddressE403 = void 0;
var SyncAddressE403 = (function () {
    function SyncAddressE403() {
    }
    SyncAddressE403.getAttributeTypeMap = function () {
        return SyncAddressE403.attributeTypeMap;
    };
    SyncAddressE403.discriminator = undefined;
    SyncAddressE403.attributeTypeMap = [
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
    return SyncAddressE403;
}());
exports.SyncAddressE403 = SyncAddressE403;
//# sourceMappingURL=syncAddressE403.js.map