"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncAddressAlreadyActive = void 0;
var SyncAddressAlreadyActive = (function () {
    function SyncAddressAlreadyActive() {
    }
    SyncAddressAlreadyActive.getAttributeTypeMap = function () {
        return SyncAddressAlreadyActive.attributeTypeMap;
    };
    SyncAddressAlreadyActive.discriminator = undefined;
    SyncAddressAlreadyActive.attributeTypeMap = [
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
    return SyncAddressAlreadyActive;
}());
exports.SyncAddressAlreadyActive = SyncAddressAlreadyActive;
//# sourceMappingURL=syncAddressAlreadyActive.js.map