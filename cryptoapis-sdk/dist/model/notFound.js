"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotFound = void 0;
var NotFound = (function () {
    function NotFound() {
    }
    NotFound.getAttributeTypeMap = function () {
        return NotFound.attributeTypeMap;
    };
    NotFound.discriminator = undefined;
    NotFound.attributeTypeMap = [
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
    return NotFound;
}());
exports.NotFound = NotFound;
//# sourceMappingURL=notFound.js.map