"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EncodeXAddressE400 = void 0;
var EncodeXAddressE400 = (function () {
    function EncodeXAddressE400() {
    }
    EncodeXAddressE400.getAttributeTypeMap = function () {
        return EncodeXAddressE400.attributeTypeMap;
    };
    EncodeXAddressE400.discriminator = undefined;
    EncodeXAddressE400.attributeTypeMap = [
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
    return EncodeXAddressE400;
}());
exports.EncodeXAddressE400 = EncodeXAddressE400;
//# sourceMappingURL=encodeXAddressE400.js.map