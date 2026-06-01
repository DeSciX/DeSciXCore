"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnsupportedMediaType = void 0;
var UnsupportedMediaType = (function () {
    function UnsupportedMediaType() {
    }
    UnsupportedMediaType.getAttributeTypeMap = function () {
        return UnsupportedMediaType.attributeTypeMap;
    };
    UnsupportedMediaType.discriminator = undefined;
    UnsupportedMediaType.attributeTypeMap = [
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
    return UnsupportedMediaType;
}());
exports.UnsupportedMediaType = UnsupportedMediaType;
//# sourceMappingURL=unsupportedMediaType.js.map