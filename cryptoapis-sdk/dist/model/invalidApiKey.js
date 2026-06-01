"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidApiKey = void 0;
var InvalidApiKey = (function () {
    function InvalidApiKey() {
    }
    InvalidApiKey.getAttributeTypeMap = function () {
        return InvalidApiKey.attributeTypeMap;
    };
    InvalidApiKey.discriminator = undefined;
    InvalidApiKey.attributeTypeMap = [
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
    return InvalidApiKey;
}());
exports.InvalidApiKey = InvalidApiKey;
//# sourceMappingURL=invalidApiKey.js.map