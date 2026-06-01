"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InsufficientCredits = void 0;
var InsufficientCredits = (function () {
    function InsufficientCredits() {
    }
    InsufficientCredits.getAttributeTypeMap = function () {
        return InsufficientCredits.attributeTypeMap;
    };
    InsufficientCredits.discriminator = undefined;
    InsufficientCredits.attributeTypeMap = [
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
    return InsufficientCredits;
}());
exports.InsufficientCredits = InsufficientCredits;
//# sourceMappingURL=insufficientCredits.js.map