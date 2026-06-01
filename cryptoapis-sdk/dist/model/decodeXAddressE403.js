"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DecodeXAddressE403 = void 0;
var DecodeXAddressE403 = (function () {
    function DecodeXAddressE403() {
    }
    DecodeXAddressE403.getAttributeTypeMap = function () {
        return DecodeXAddressE403.attributeTypeMap;
    };
    DecodeXAddressE403.discriminator = undefined;
    DecodeXAddressE403.attributeTypeMap = [
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
    return DecodeXAddressE403;
}());
exports.DecodeXAddressE403 = DecodeXAddressE403;
//# sourceMappingURL=decodeXAddressE403.js.map