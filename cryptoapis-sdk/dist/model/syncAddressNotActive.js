"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncAddressNotActive = void 0;
var SyncAddressNotActive = (function () {
    function SyncAddressNotActive() {
    }
    SyncAddressNotActive.getAttributeTypeMap = function () {
        return SyncAddressNotActive.attributeTypeMap;
    };
    SyncAddressNotActive.discriminator = undefined;
    SyncAddressNotActive.attributeTypeMap = [
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
    return SyncAddressNotActive;
}());
exports.SyncAddressNotActive = SyncAddressNotActive;
//# sourceMappingURL=syncAddressNotActive.js.map