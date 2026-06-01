"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CanNotDeleteSyncingAddress = void 0;
var CanNotDeleteSyncingAddress = (function () {
    function CanNotDeleteSyncingAddress() {
    }
    CanNotDeleteSyncingAddress.getAttributeTypeMap = function () {
        return CanNotDeleteSyncingAddress.attributeTypeMap;
    };
    CanNotDeleteSyncingAddress.discriminator = undefined;
    CanNotDeleteSyncingAddress.attributeTypeMap = [
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
    return CanNotDeleteSyncingAddress;
}());
exports.CanNotDeleteSyncingAddress = CanNotDeleteSyncingAddress;
//# sourceMappingURL=canNotDeleteSyncingAddress.js.map