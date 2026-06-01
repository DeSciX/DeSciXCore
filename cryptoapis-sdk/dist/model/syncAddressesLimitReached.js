"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncAddressesLimitReached = void 0;
var SyncAddressesLimitReached = (function () {
    function SyncAddressesLimitReached() {
    }
    SyncAddressesLimitReached.getAttributeTypeMap = function () {
        return SyncAddressesLimitReached.attributeTypeMap;
    };
    SyncAddressesLimitReached.discriminator = undefined;
    SyncAddressesLimitReached.attributeTypeMap = [
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
    return SyncAddressesLimitReached;
}());
exports.SyncAddressesLimitReached = SyncAddressesLimitReached;
//# sourceMappingURL=syncAddressesLimitReached.js.map