"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidXpub = void 0;
var InvalidXpub = (function () {
    function InvalidXpub() {
    }
    InvalidXpub.getAttributeTypeMap = function () {
        return InvalidXpub.attributeTypeMap;
    };
    InvalidXpub.discriminator = undefined;
    InvalidXpub.attributeTypeMap = [
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
    return InvalidXpub;
}());
exports.InvalidXpub = InvalidXpub;
//# sourceMappingURL=invalidXpub.js.map