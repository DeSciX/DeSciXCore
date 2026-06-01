"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncAddressE401 = void 0;
var SyncAddressE401 = (function () {
    function SyncAddressE401() {
    }
    SyncAddressE401.getAttributeTypeMap = function () {
        return SyncAddressE401.attributeTypeMap;
    };
    SyncAddressE401.discriminator = undefined;
    SyncAddressE401.attributeTypeMap = [
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
    return SyncAddressE401;
}());
exports.SyncAddressE401 = SyncAddressE401;
//# sourceMappingURL=syncAddressE401.js.map