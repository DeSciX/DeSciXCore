"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerifyAddressE400 = void 0;
var VerifyAddressE400 = (function () {
    function VerifyAddressE400() {
    }
    VerifyAddressE400.getAttributeTypeMap = function () {
        return VerifyAddressE400.attributeTypeMap;
    };
    VerifyAddressE400.discriminator = undefined;
    VerifyAddressE400.attributeTypeMap = [
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
    return VerifyAddressE400;
}());
exports.VerifyAddressE400 = VerifyAddressE400;
//# sourceMappingURL=verifyAddressE400.js.map