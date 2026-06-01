"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MissingApiKey = void 0;
var MissingApiKey = (function () {
    function MissingApiKey() {
    }
    MissingApiKey.getAttributeTypeMap = function () {
        return MissingApiKey.attributeTypeMap;
    };
    MissingApiKey.discriminator = undefined;
    MissingApiKey.attributeTypeMap = [
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
    return MissingApiKey;
}());
exports.MissingApiKey = MissingApiKey;
//# sourceMappingURL=missingApiKey.js.map