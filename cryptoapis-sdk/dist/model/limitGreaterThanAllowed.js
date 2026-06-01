"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LimitGreaterThanAllowed = void 0;
var LimitGreaterThanAllowed = (function () {
    function LimitGreaterThanAllowed() {
    }
    LimitGreaterThanAllowed.getAttributeTypeMap = function () {
        return LimitGreaterThanAllowed.attributeTypeMap;
    };
    LimitGreaterThanAllowed.discriminator = undefined;
    LimitGreaterThanAllowed.attributeTypeMap = [
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
    return LimitGreaterThanAllowed;
}());
exports.LimitGreaterThanAllowed = LimitGreaterThanAllowed;
//# sourceMappingURL=limitGreaterThanAllowed.js.map