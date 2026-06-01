"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.XpubAlreadyActive = void 0;
var XpubAlreadyActive = (function () {
    function XpubAlreadyActive() {
    }
    XpubAlreadyActive.getAttributeTypeMap = function () {
        return XpubAlreadyActive.attributeTypeMap;
    };
    XpubAlreadyActive.discriminator = undefined;
    XpubAlreadyActive.attributeTypeMap = [
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
    return XpubAlreadyActive;
}());
exports.XpubAlreadyActive = XpubAlreadyActive;
//# sourceMappingURL=xpubAlreadyActive.js.map