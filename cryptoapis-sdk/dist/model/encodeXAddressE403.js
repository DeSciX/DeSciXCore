"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EncodeXAddressE403 = void 0;
var EncodeXAddressE403 = (function () {
    function EncodeXAddressE403() {
    }
    EncodeXAddressE403.getAttributeTypeMap = function () {
        return EncodeXAddressE403.attributeTypeMap;
    };
    EncodeXAddressE403.discriminator = undefined;
    EncodeXAddressE403.attributeTypeMap = [
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
    return EncodeXAddressE403;
}());
exports.EncodeXAddressE403 = EncodeXAddressE403;
//# sourceMappingURL=encodeXAddressE403.js.map