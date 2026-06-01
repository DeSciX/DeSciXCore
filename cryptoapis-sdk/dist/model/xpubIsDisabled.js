"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.XpubIsDisabled = void 0;
var XpubIsDisabled = (function () {
    function XpubIsDisabled() {
    }
    XpubIsDisabled.getAttributeTypeMap = function () {
        return XpubIsDisabled.attributeTypeMap;
    };
    XpubIsDisabled.discriminator = undefined;
    XpubIsDisabled.attributeTypeMap = [
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
    return XpubIsDisabled;
}());
exports.XpubIsDisabled = XpubIsDisabled;
//# sourceMappingURL=xpubIsDisabled.js.map