"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EncodeXAddressE401 = void 0;
var EncodeXAddressE401 = (function () {
    function EncodeXAddressE401() {
    }
    EncodeXAddressE401.getAttributeTypeMap = function () {
        return EncodeXAddressE401.attributeTypeMap;
    };
    EncodeXAddressE401.discriminator = undefined;
    EncodeXAddressE401.attributeTypeMap = [
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
    return EncodeXAddressE401;
}());
exports.EncodeXAddressE401 = EncodeXAddressE401;
//# sourceMappingURL=encodeXAddressE401.js.map