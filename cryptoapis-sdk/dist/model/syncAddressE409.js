"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncAddressE409 = void 0;
var SyncAddressE409 = (function () {
    function SyncAddressE409() {
    }
    SyncAddressE409.getAttributeTypeMap = function () {
        return SyncAddressE409.attributeTypeMap;
    };
    SyncAddressE409.discriminator = undefined;
    SyncAddressE409.attributeTypeMap = [
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
    return SyncAddressE409;
}());
exports.SyncAddressE409 = SyncAddressE409;
//# sourceMappingURL=syncAddressE409.js.map