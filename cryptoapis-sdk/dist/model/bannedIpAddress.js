"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BannedIpAddress = void 0;
var BannedIpAddress = (function () {
    function BannedIpAddress() {
    }
    BannedIpAddress.getAttributeTypeMap = function () {
        return BannedIpAddress.attributeTypeMap;
    };
    BannedIpAddress.discriminator = undefined;
    BannedIpAddress.attributeTypeMap = [
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
    return BannedIpAddress;
}());
exports.BannedIpAddress = BannedIpAddress;
//# sourceMappingURL=bannedIpAddress.js.map