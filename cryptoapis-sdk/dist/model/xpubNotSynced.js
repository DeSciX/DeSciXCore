"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.XpubNotSynced = void 0;
var XpubNotSynced = (function () {
    function XpubNotSynced() {
    }
    XpubNotSynced.getAttributeTypeMap = function () {
        return XpubNotSynced.attributeTypeMap;
    };
    XpubNotSynced.discriminator = undefined;
    XpubNotSynced.attributeTypeMap = [
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
    return XpubNotSynced;
}());
exports.XpubNotSynced = XpubNotSynced;
//# sourceMappingURL=xpubNotSynced.js.map