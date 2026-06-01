"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.XpubsLimitReached = void 0;
var XpubsLimitReached = (function () {
    function XpubsLimitReached() {
    }
    XpubsLimitReached.getAttributeTypeMap = function () {
        return XpubsLimitReached.attributeTypeMap;
    };
    XpubsLimitReached.discriminator = undefined;
    XpubsLimitReached.attributeTypeMap = [
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
    return XpubsLimitReached;
}());
exports.XpubsLimitReached = XpubsLimitReached;
//# sourceMappingURL=xpubsLimitReached.js.map