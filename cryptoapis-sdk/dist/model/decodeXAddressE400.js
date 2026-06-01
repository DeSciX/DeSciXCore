"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DecodeXAddressE400 = void 0;
var DecodeXAddressE400 = (function () {
    function DecodeXAddressE400() {
    }
    DecodeXAddressE400.getAttributeTypeMap = function () {
        return DecodeXAddressE400.attributeTypeMap;
    };
    DecodeXAddressE400.discriminator = undefined;
    DecodeXAddressE400.attributeTypeMap = [
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
    return DecodeXAddressE400;
}());
exports.DecodeXAddressE400 = DecodeXAddressE400;
//# sourceMappingURL=decodeXAddressE400.js.map