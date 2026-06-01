"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DecodeXAddressE401 = void 0;
var DecodeXAddressE401 = (function () {
    function DecodeXAddressE401() {
    }
    DecodeXAddressE401.getAttributeTypeMap = function () {
        return DecodeXAddressE401.attributeTypeMap;
    };
    DecodeXAddressE401.discriminator = undefined;
    DecodeXAddressE401.attributeTypeMap = [
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
    return DecodeXAddressE401;
}());
exports.DecodeXAddressE401 = DecodeXAddressE401;
//# sourceMappingURL=decodeXAddressE401.js.map