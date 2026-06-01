"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncAddressE400 = void 0;
var SyncAddressE400 = (function () {
    function SyncAddressE400() {
    }
    SyncAddressE400.getAttributeTypeMap = function () {
        return SyncAddressE400.attributeTypeMap;
    };
    SyncAddressE400.discriminator = undefined;
    SyncAddressE400.attributeTypeMap = [
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
    return SyncAddressE400;
}());
exports.SyncAddressE400 = SyncAddressE400;
//# sourceMappingURL=syncAddressE400.js.map